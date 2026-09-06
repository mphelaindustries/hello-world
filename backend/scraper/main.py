"""Tender OS scraper service (Google Cloud Run).

Scales to zero: the container starts when /scrape is called, does the work,
writes to Firestore, and shuts down. No always-on browser, no idle cost.
"""
from __future__ import annotations

import os
import asyncio
import logging
from datetime import datetime, timezone

from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel

from adapters import ADAPTERS
from store import save_tenders, start_run, finish_run

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("scraper")

app = FastAPI(title="Tender OS Scraper")

SCRAPER_TOKEN = os.environ.get("SCRAPER_TOKEN", "")


class ScrapeRequest(BaseModel):
    sources: list[str] | None = None
    max_pages: int = 3


def check_auth(authorization: str | None) -> None:
    if not SCRAPER_TOKEN:
        raise HTTPException(500, "SCRAPER_TOKEN is not configured")
    if authorization != f"Bearer {SCRAPER_TOKEN}":
        raise HTTPException(401, "Unauthorized")


@app.get("/health")
async def health():
    return {"ok": True, "adapters": sorted(ADAPTERS), "time": datetime.now(timezone.utc).isoformat()}


@app.post("/scrape")
async def scrape(req: ScrapeRequest, authorization: str | None = Header(default=None)):
    check_auth(authorization)

    names = req.sources or list(ADAPTERS)
    unknown = [n for n in names if n not in ADAPTERS]
    if unknown:
        raise HTTPException(400, f"Unknown source(s): {', '.join(unknown)}")

    run_id = start_run(names)
    errors: list[dict] = []
    all_tenders: list[dict] = []

    async def run_one(name: str):
        adapter = ADAPTERS[name]
        try:
            found = await adapter.fetch(max_pages=req.max_pages)
            log.info("%s -> %d tenders", name, len(found))
            return found
        except Exception as exc:  # one bad source must not kill the run
            log.exception("adapter %s failed", name)
            errors.append({"source": name, "error": str(exc)})
            return []

    results = await asyncio.gather(*(run_one(n) for n in names))
    for chunk in results:
        all_tenders.extend(chunk)

    created, updated = save_tenders(all_tenders)
    finish_run(run_id, found=len(all_tenders), created=created, updated=updated, errors=errors)

    return {
        "runId": run_id,
        "found": len(all_tenders),
        "new": created,
        "updated": updated,
        "errors": errors,
    }
