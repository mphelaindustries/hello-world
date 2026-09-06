"""Registry of every scraper node.

Each entry is one "node" — an independent scraper for a single South African
tender source. They all run concurrently in one Cloud Run invocation, and a
failure in one never stops the others.

Adding a new source is usually one dictionary entry below. Only write a new
module when the site needs custom logic (like eTenders' JSON API).
"""
from __future__ import annotations

from .base import BaseAdapter
from .etenders import ETendersAdapter
from .generic_table import GenericTableAdapter

ADAPTERS: dict[str, BaseAdapter] = {
    # National portal (JSON API with HTML fallback)
    "etenders": ETendersAdapter(),

    # State-owned enterprises
    "eskom": GenericTableAdapter(
        source_id="eskom",
        name="Eskom Tender Bulletin",
        base_url="https://tenderbulletin.eskom.co.za",
        list_urls=["https://tenderbulletin.eskom.co.za/tenders"],
        organisation="Eskom Holdings SOC Ltd",
        columns={"reference": 0, "title": 1, "published_date": 2, "closing_date": 3},
        page_param="page",
        default_province="National",
    ),
    "transnet": GenericTableAdapter(
        source_id="transnet",
        name="Transnet eTender Portal",
        base_url="https://transnetetenders.azurewebsites.net",
        list_urls=["https://transnetetenders.azurewebsites.net/Home/TenderOpportunities"],
        organisation="Transnet SOC Ltd",
        columns={"reference": 0, "title": 1, "organisation": 2, "closing_date": 3},
        page_param="page",
        default_province="National",
    ),
    "sanral": GenericTableAdapter(
        source_id="sanral",
        name="SANRAL Tenders",
        base_url="https://www.nra.co.za",
        list_urls=["https://www.nra.co.za/live/content.php?Item_ID=15"],
        organisation="South African National Roads Agency (SANRAL)",
        row_selector="table tr",
        columns={"reference": 0, "title": 1, "closing_date": 2},
        default_province="National",
    ),
    "prasa": GenericTableAdapter(
        source_id="prasa",
        name="PRASA Tenders",
        base_url="https://www.prasa.com",
        list_urls=["https://www.prasa.com/tenders.html"],
        organisation="Passenger Rail Agency of South Africa (PRASA)",
        row_selector="table tr",
        columns={"reference": 0, "title": 1, "closing_date": 2},
        default_province="National",
    ),

    # Metros / municipalities
    "joburg": GenericTableAdapter(
        source_id="joburg",
        name="City of Johannesburg",
        base_url="https://www.joburg.org.za",
        list_urls=["https://www.joburg.org.za/documents_/Pages/Tenders.aspx"],
        organisation="City of Johannesburg Metropolitan Municipality",
        row_selector="table tr",
        columns={"reference": 0, "title": 1, "closing_date": 2},
        default_province="Gauteng",
    ),
    "tshwane": GenericTableAdapter(
        source_id="tshwane",
        name="City of Tshwane",
        base_url="https://www.tshwane.gov.za",
        list_urls=["https://www.tshwane.gov.za/?page_id=1157"],
        organisation="City of Tshwane Metropolitan Municipality",
        row_selector="table tr",
        columns={"reference": 0, "title": 1, "closing_date": 2},
        default_province="Gauteng",
    ),
    "ekurhuleni": GenericTableAdapter(
        source_id="ekurhuleni",
        name="City of Ekurhuleni",
        base_url="https://www.ekurhuleni.gov.za",
        list_urls=["https://www.ekurhuleni.gov.za/tenders/"],
        organisation="City of Ekurhuleni Metropolitan Municipality",
        row_selector="table tr",
        columns={"reference": 0, "title": 1, "closing_date": 2},
        default_province="Gauteng",
    ),
    "polokwane": GenericTableAdapter(
        source_id="polokwane",
        name="Polokwane Municipality",
        base_url="https://www.polokwane.gov.za",
        list_urls=["https://www.polokwane.gov.za/Business/Pages/Tenders.aspx"],
        organisation="Polokwane Local Municipality",
        row_selector="table tr",
        columns={"reference": 0, "title": 1, "closing_date": 2},
        default_province="Limpopo",
    ),
}

__all__ = ["ADAPTERS", "BaseAdapter", "ETendersAdapter", "GenericTableAdapter"]
