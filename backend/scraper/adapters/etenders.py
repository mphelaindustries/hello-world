"""National eTender Publication Portal — etenders.gov.za

The portal exposes a JSON endpoint used by its own table widget, so no browser
is needed. If the endpoint moves, the HTML fallback below still works.
"""
from __future__ import annotations

import logging

from .base import BaseAdapter, Tender, guess_province, parse_date, parse_money, parse_cidb, text_of

log = logging.getLogger("scraper.etenders")

API = "https://www.etenders.gov.za/api/OpenOpportunities"
HTML_LIST = "https://www.etenders.gov.za/Home/opportunities?id=1"


class ETendersAdapter(BaseAdapter):
    source_id = "etenders"
    name = "National eTender Portal"
    base_url = "https://www.etenders.gov.za"

    async def fetch(self, max_pages: int = 3) -> list[dict]:
        async with await self.client() as client:
            try:
                return await self._fetch_api(client)
            except Exception as exc:
                log.warning("eTenders API failed (%s); falling back to HTML", exc)
                return await self._fetch_html(client, max_pages)

    async def _fetch_api(self, client) -> list[dict]:
        res = await self.get(client, API, headers={"Accept": "application/json"})
        rows = res.json()
        if isinstance(rows, dict):
            rows = rows.get("data") or rows.get("items") or []

        out: list[dict] = []
        for row in rows:
            try:
                ref = str(row.get("tender_No") or row.get("tenderNumber") or row.get("reference") or "").strip()
                title = str(row.get("description") or row.get("title") or "").strip()
                if not ref or not title:
                    continue
                org = str(row.get("department") or row.get("organOfState") or "Unknown").strip()
                blob = f"{title} {row.get('province','')} {row.get('placeServicesRequired','')}"
                doc_url = row.get("supportDocument") or row.get("documentUrl")

                out.append(
                    Tender(
                        reference=ref,
                        title=title,
                        organisation=org,
                        source_id=self.source_id,
                        source_url=f"{self.base_url}/Home/TenderDetails?id={row.get('id','')}",
                        province=row.get("province") or guess_province(blob),
                        category=row.get("category") or row.get("type"),
                        description=row.get("specialConditions") or title,
                        closing_date=parse_date(row.get("closingDate") or row.get("dateClosing")),
                        published_date=parse_date(row.get("datePublished") or row.get("advertisedDate")),
                        briefing=row.get("briefingVenue"),
                        contact=row.get("contactPerson") or row.get("email"),
                        value=parse_money(str(row.get("value") or "")),
                        cidb_grade=parse_cidb(blob),
                        documents=[{"name": "Tender document", "url": doc_url}] if doc_url else [],
                    ).to_doc()
                )
            except Exception:
                log.exception("skipping malformed eTenders row")
        return out

    async def _fetch_html(self, client, max_pages: int) -> list[dict]:
        out: list[dict] = []
        for page in range(1, max_pages + 1):
            res = await self.get(client, f"{HTML_LIST}&page={page}")
            tree = self.html(res)
            rows = tree.css("table tbody tr")
            if not rows:
                break
            for tr in rows:
                cells = [text_of(td) for td in tr.css("td")]
                if len(cells) < 4:
                    continue
                link = tr.css_first("a")
                href = link.attributes.get("href", "") if link else ""
                ref, title, org = cells[0], cells[1], cells[2]
                if not ref or not title:
                    continue
                out.append(
                    Tender(
                        reference=ref,
                        title=title,
                        organisation=org or "Unknown",
                        source_id=self.source_id,
                        source_url=href if href.startswith("http") else f"{self.base_url}{href}",
                        province=guess_province(" ".join(cells)),
                        closing_date=parse_date(cells[3] if len(cells) > 3 else None),
                        cidb_grade=parse_cidb(" ".join(cells)),
                    ).to_doc()
                )
        return out
