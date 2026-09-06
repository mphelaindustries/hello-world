"""Shared helpers for every source adapter.

Rules every adapter follows:
  * plain HTTP only (httpx + selectolax) — no browser, no Playwright
  * polite: identifiable user agent, one request at a time per host, small delay
  * never raises for a single bad row; skips it and carries on
"""
from __future__ import annotations

import asyncio
import hashlib
import logging
import re
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone

import httpx
from dateutil import parser as dateparser
from selectolax.parser import HTMLParser

log = logging.getLogger("scraper.adapter")

USER_AGENT = (
    "TenderOSBot/1.0 (+https://mphelaindustries.co.za; tender monitoring for a "
    "registered South African supplier; contact: tenders@mphelaindustries.co.za)"
)
REQUEST_DELAY = 1.2       # seconds between requests to the same host
TIMEOUT = httpx.Timeout(45.0, connect=20.0)


@dataclass
class Tender:
    reference: str
    title: str
    organisation: str
    source_id: str
    source_url: str
    province: str | None = None
    category: str | None = None
    description: str | None = None
    closing_date: str | None = None
    published_date: str | None = None
    briefing: str | None = None
    contact: str | None = None
    value: float | None = None
    cidb_grade: str | None = None
    documents: list[dict] = field(default_factory=list)

    @property
    def hash(self) -> str:
        key = f"{self.reference.strip().lower()}|{self.organisation.strip().lower()}"
        return hashlib.sha256(key.encode()).hexdigest()[:32]

    def to_doc(self) -> dict:
        d = {
            "reference": self.reference,
            "title": self.title,
            "organisation": self.organisation,
            "sourceId": self.source_id,
            "sourceUrl": self.source_url,
            "province": self.province,
            "category": self.category,
            "description": self.description,
            "closingDate": self.closing_date,
            "publishedDate": self.published_date,
            "briefing": self.briefing,
            "contact": self.contact,
            "value": self.value,
            "cidbGrade": self.cidb_grade,
            "documents": self.documents,
            "hash": self.hash,
            "scrapedAt": datetime.now(timezone.utc).isoformat(),
        }
        return {k: v for k, v in d.items() if v is not None}


PROVINCES = [
    "Gauteng", "Limpopo", "Mpumalanga", "North West", "Free State",
    "KwaZulu-Natal", "Eastern Cape", "Western Cape", "Northern Cape", "National",
]


def guess_province(text: str) -> str | None:
    lowered = (text or "").lower()
    for p in PROVINCES:
        if p.lower() in lowered:
            return p
    if "kzn" in lowered:
        return "KwaZulu-Natal"
    return None


def parse_date(value: str | None) -> str | None:
    if not value:
        return None
    cleaned = re.sub(r"\s+", " ", value).strip().strip(".,")
    try:
        dt = dateparser.parse(cleaned, dayfirst=True, fuzzy=True)
    except (ValueError, OverflowError):
        return None
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.isoformat()


def parse_money(value: str | None) -> float | None:
    if not value:
        return None
    m = re.search(r"R?\s*([\d\s,]+(?:\.\d{2})?)", value.replace("\xa0", " "))
    if not m:
        return None
    try:
        return float(m.group(1).replace(" ", "").replace(",", ""))
    except ValueError:
        return None


def parse_cidb(text: str) -> str | None:
    m = re.search(r"\b(\d{1,2}\s?[A-Z]{1,2})\s*(?:CIDB|grading)?\b", text or "", re.I)
    if m and re.search(r"cidb", text or "", re.I):
        return m.group(1).replace(" ", "").upper()
    return None


def text_of(node) -> str:
    return re.sub(r"\s+", " ", node.text(strip=True)) if node else ""


class BaseAdapter:
    """Subclasses implement `fetch`."""

    source_id: str = "base"
    name: str = "Base"
    base_url: str = ""

    async def fetch(self, max_pages: int = 3) -> list[dict]:
        raise NotImplementedError

    async def client(self) -> httpx.AsyncClient:
        return httpx.AsyncClient(
            timeout=TIMEOUT,
            follow_redirects=True,
            headers={
                "User-Agent": USER_AGENT,
                "Accept": "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
                "Accept-Language": "en-ZA,en;q=0.9",
            },
        )

    async def get(self, client: httpx.AsyncClient, url: str, **kw) -> httpx.Response:
        for attempt in range(3):
            try:
                res = await client.get(url, **kw)
                if res.status_code in (429, 503):
                    await asyncio.sleep(3 * (attempt + 1))
                    continue
                res.raise_for_status()
                await asyncio.sleep(REQUEST_DELAY)
                return res
            except httpx.HTTPError as exc:
                if attempt == 2:
                    raise
                log.warning("%s retry %s: %s", self.source_id, attempt + 1, exc)
                await asyncio.sleep(2 * (attempt + 1))
        raise RuntimeError("unreachable")

    @staticmethod
    def html(res: httpx.Response) -> HTMLParser:
        return HTMLParser(res.text)


__all__ = [
    "BaseAdapter", "Tender", "HTMLParser", "asdict",
    "guess_province", "parse_date", "parse_money", "parse_cidb", "text_of",
]
