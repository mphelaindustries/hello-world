"""Firestore writes for the scraper.

Deduplication: the document id is the tender hash (reference + organisation),
so re-running the scraper updates the existing record instead of creating a
duplicate. Workflow fields owned by the app (status, notes, matchScore) are
never overwritten.
"""
from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone

from google.cloud import firestore

log = logging.getLogger("scraper.store")

_db: firestore.Client | None = None

# Fields the app owns — the scraper must not clobber these on re-scrape.
APP_OWNED = {"status", "notes", "assignedTo", "matchScore", "matchReasons", "pinned"}


def db() -> firestore.Client:
    global _db
    if _db is None:
        _db = firestore.Client()
    return _db


def start_run(sources: list[str]) -> str:
    run_id = uuid.uuid4().hex[:12]
    db().collection("scraperRuns").document(run_id).set(
        {
            "status": "running",
            "sources": sources,
            "startedAt": datetime.now(timezone.utc),
            "found": 0,
            "new": 0,
        }
    )
    return run_id


def finish_run(run_id: str, *, found: int, created: int, updated: int, errors: list[dict]) -> None:
    db().collection("scraperRuns").document(run_id).set(
        {
            "status": "failed" if errors and found == 0 else "completed",
            "finishedAt": datetime.now(timezone.utc),
            "found": found,
            "new": created,
            "updated": updated,
            "errors": errors,
        },
        merge=True,
    )


def save_tenders(tenders: list[dict]) -> tuple[int, int]:
    """Returns (created, updated)."""
    if not tenders:
        return 0, 0

    client = db()
    created = updated = 0
    now = datetime.now(timezone.utc)

    # Firestore batches cap at 500 writes.
    for start in range(0, len(tenders), 400):
        chunk = tenders[start : start + 400]
        refs = [client.collection("tenders").document(t["hash"]) for t in chunk]
        existing = {s.id: s.exists for s in client.get_all(refs)}

        batch = client.batch()
        for ref, tender in zip(refs, chunk):
            payload = {k: v for k, v in tender.items() if k not in APP_OWNED}
            if existing.get(ref.id):
                payload["lastSeenAt"] = now
                batch.set(ref, payload, merge=True)
                updated += 1
            else:
                payload.update({"status": "new", "createdAt": now, "lastSeenAt": now})
                batch.set(ref, payload)
                created += 1
        batch.commit()

    _touch_sources(tenders)
    log.info("saved %d tenders (%d new, %d updated)", len(tenders), created, updated)
    return created, updated


def _touch_sources(tenders: list[dict]) -> None:
    counts: dict[str, int] = {}
    for t in tenders:
        counts[t.get("sourceId", "unknown")] = counts.get(t.get("sourceId", "unknown"), 0) + 1

    batch = db().batch()
    for source_id, count in counts.items():
        batch.set(
            db().collection("sources").document(source_id),
            {
                "lastRun": datetime.now(timezone.utc),
                "lastStatus": "Active",
                "found": count,
            },
            merge=True,
        )
    batch.commit()
