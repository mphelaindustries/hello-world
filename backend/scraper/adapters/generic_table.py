"""A configurable adapter for tender pages that publish a plain HTML table or
list. Most SOE portals (Eskom, Transnet, SANRAL, PRASA) fall into this shape,
so each one is just a small configuration rather than new code.
"""
from __future__ import annotations

import logging

from .base import BaseAdapter, Tender, guess_province, parse_date, parse_money, parse_cidb, text_of

log = logging.getLogger("scraper.generic")


class GenericTableAdapter(BaseAdapter):
    def __init__(
        self,
        *,
        source_id: str,
        name: str,
        base_url: str,
        list_urls: list[str],
        organisation: str,
        row_selector: str = "table tbody tr",
        columns: dict[str, int] | None = None,
        page_param: str | None = None,
        default_province: str | None = None,
    ):
        self.source_id = source_id
        self.name = name
        self.base_url = base_url
        self.list_urls = list_urls
        self.organisation = organisation
        self.row_selector = row_selector
        self.columns = columns or {"reference": 0, "title": 1, "closing_date": 2}
        self.page_param = page_param
        self.default_province = default_province

    def _cell(self, cells: list[str], key: str) -> str | None:
        idx = self.columns.get(key)
        if idx is None or idx >= len(cells):
            return None
        return cells[idx] or None

    async def fetch(self, max_pages: int = 3) -> list[dict]:
        out: list[dict] = []
        async with await self.client() as client:
            for url in self.list_urls:
                pages = range(1, max_pages + 1) if self.page_param else [1]
                for page in pages:
                    target = f"{url}{'&' if '?' in url else '?'}{self.page_param}={page}" if self.page_param else url
                    try:
                        res = await self.get(client, target)
                    except Exception as exc:
                        log.warning("%s: %s unreachable (%s)", self.source_id, target, exc)
                        break

                    rows = self.html(res).css(self.row_selector)
                    if not rows:
                        break

                    for tr in rows:
                        try:
                            cells = [text_of(td) for td in tr.css("td, th")]
                            if len(cells) < 2:
                                continue
                            ref = self._cell(cells, "reference")
                            title = self._cell(cells, "title")
                            if not ref or not title:
                                continue

                            link = tr.css_first("a")
                            href = link.attributes.get("href", "") if link else ""
                            if href and not href.startswith("http"):
                                href = f"{self.base_url.rstrip('/')}/{href.lstrip('/')}"

                            docs = []
                            for a in tr.css("a[href$='.pdf'], a[href$='.zip'], a[href$='.doc'], a[href$='.docx']"):
                                doc_href = a.attributes.get("href", "")
                                if doc_href and not doc_href.startswith("http"):
                                    doc_href = f"{self.base_url.rstrip('/')}/{doc_href.lstrip('/')}"
                                docs.append({"name": text_of(a) or "Document", "url": doc_href})

                            blob = " ".join(cells)
                            out.append(
                                Tender(
                                    reference=ref,
                                    title=title,
                                    organisation=self._cell(cells, "organisation") or self.organisation,
                                    source_id=self.source_id,
                                    source_url=href or target,
                                    province=guess_province(blob) or self.default_province,
                                    category=self._cell(cells, "category"),
                                    description=self._cell(cells, "description") or title,
                                    closing_date=parse_date(self._cell(cells, "closing_date")),
                                    published_date=parse_date(self._cell(cells, "published_date")),
                                    value=parse_money(self._cell(cells, "value")),
                                    cidb_grade=parse_cidb(blob),
                                    documents=docs,
                                ).to_doc()
                            )
                        except Exception:
                            log.exception("%s: skipping malformed row", self.source_id)
        return out
