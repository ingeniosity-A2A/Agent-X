"""
VCF/vCard Generator for Appless Mobile Care

Generates vCard 3.0 files with:
- Standard contact fields (FN, ORG, TEL, EMAIL, URL, ADR, NOTE)
- Custom X-APPLESS-* properties for service routing
- QR code embedding option
- Multi-service card variants
"""

import uuid
import base64
import hashlib
from datetime import datetime, timezone
from typing import Optional


# ─── vCard Templates ────────────────────────────────────────────────

VCARD_TEMPLATE = """\
BEGIN:VCARD
VERSION:3.0
N:{last};{first};;;
FN:{full_name}
ORG:{org}
TITLE:{title}
TEL;TYPE=WORK,VOICE:{phone}
EMAIL;TYPE=WORK:{email}
URL:{url}
ADR;TYPE=WORK:;;{street};{city};{state};{zip};{country}
NOTE:{note}
{custom_fields}
REV:{rev}
UID:{uid}
END:VCARD"""


# ─── Custom X- Properties ────────────────────────────────────────────

def _build_custom_fields(
    service_id: str,
    service_type: str,
    service_areas: list[str],
    services_offered: list[str],
    agent_endpoint: str,
    card_variant: str = "standard",
) -> str:
    """Build X-APPLESS-* custom properties for the vCard."""
    lines = []
    lines.append(f"X-APPLESS-ID:{service_id}")
    lines.append(f"X-APPLESS-TYPE:{service_type}")
    lines.append(f"X-APPLESS-VARIANT:{card_variant}")
    lines.append(f"X-APPLESS-AGENT:{agent_endpoint}")
    lines.append(f"X-APPLESS-AREAS:{','.join(service_areas)}")
    lines.append(f"X-APPLESS-SERVICES:{'|'.join(services_offered)}")
    lines.append(f"X-APPLESS-CREATED:{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')}")
    return "\n".join(lines)


# ─── Note Builder ────────────────────────────────────────────────────

def _build_note(
    company: str,
    services: list[str],
    areas: list[str],
    tagline: str = "",
) -> str:
    """Build a rich NOTE field with service summary."""
    parts = []
    if tagline:
        parts.append(tagline)
    parts.append(f"Services: {', '.join(services[:5])}")
    if len(services) > 5:
        parts.append(f"...and {len(services) - 5} more")
    parts.append(f"Areas: {', '.join(areas)}")
    parts.append("Save this contact for instant support!")
    return "\\n".join(parts)


# ─── Card Variants ───────────────────────────────────────────────────

VARIANTS = {
    "standard": {
        "title": "Customer Care",
        "tagline": "Your furniture assembly partner",
        "services": [
            "IKEA Assembly", "Furniture Assembly", "Mounting & Installation",
            "Outdoor Assembly", "Commercial Assembly", "Repairs & Adjustments",
        ],
    },
    "premium": {
        "title": "Premium Services",
        "tagline": "White-glove assembly & installation",
        "services": [
            "Kitchen Installation", "Walk-in Closet Systems", "Murphy Beds",
            "Home Gym Setup", "Modular Sectionals", "Custom Solutions",
        ],
    },
    "commercial": {
        "title": "Business Solutions",
        "tagline": "Office & retail furniture services",
        "services": [
            "Office Desks", "Conference Tables", "Reception Areas",
            "Cubicle Partitions", "Retail Shelving", "Bulk Assembly",
        ],
    },
    "tech": {
        "title": "Field Technician",
        "tagline": "Your assigned assembly specialist",
        "services": [
            "On-site Assembly", "Quality Inspection", "Customer Walkthrough",
            "Post-Assembly Support", "Warranty Service",
        ],
    },
}


# ─── Generator ───────────────────────────────────────────────────────

def generate_vcf(
    company: str = "Help Assembly Services LLC",
    phone: str = "+14044391350",
    email: str = "care@helpassembly.com",
    street: str = "",
    city: str = "Atlanta",
    state: str = "GA",
    zip_code: str = "30301",
    country: str = "USA",
    base_url: str = "https://care.helpassembly.com",
    agent_endpoint: str = "https://care.helpassembly.com/api/process",
    variant: str = "standard",
    service_areas: Optional[list[str]] = None,
    service_id: Optional[str] = None,
) -> str:
    """
    Generate a vCard 3.0 string for Appless mobile care.
    
    Args:
        variant: Card type — "standard", "premium", "commercial", or "tech"
        base_url: Landing page URL embedded in the contact
        agent_endpoint: API endpoint for the care agent
        service_id: Unique ID (auto-generated if not provided)
    
    Returns:
        vCard string ready to write to a .vcf file
    """
    if service_areas is None:
        service_areas = [
            "Atlanta", "Marietta", "Decatur", "Alpharetta", "Sandy Springs",
            "Roswell", "Johns Creek", "Duluth", "Lawrenceville", "Smyrna",
            "Tucker", "Brookhaven", "Dunwoody", "Kennesaw",
        ]

    if service_id is None:
        service_id = f"appless-{uuid.uuid4().hex[:12]}"

    v = VARIANTS.get(variant, VARIANTS["standard"])
    
    # Contact display name
    first = company.split()[0]  # "Help"
    last = "Assembly Services"
    full_name = f"{company} — {v['title']}"

    # Build care URL with service context
    care_url = f"{base_url}/care?sid={service_id}&v={variant}"

    # NOTE field
    note = _build_note(company, v["services"], service_areas, v["tagline"])

    # Custom X- properties
    custom = _build_custom_fields(
        service_id=service_id,
        service_type=variant,
        service_areas=service_areas,
        services_offered=v["services"],
        agent_endpoint=agent_endpoint,
        card_variant=variant,
    )

    return VCARD_TEMPLATE.format(
        last=last,
        first=first,
        full_name=full_name,
        org=company,
        title=v["title"],
        phone=phone,
        email=email,
        url=care_url,
        street=street,
        city=city,
        state=state,
        zip=zip_code,
        country=country,
        note=note,
        custom_fields=custom,
        rev=datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ"),
        uid=f"urn:uuid:{uuid.uuid4()}",
    )


def generate_vcf_bytes(
    variant: str = "standard",
    encoding: str = "utf-8",
    **kwargs,
) -> bytes:
    """Generate vCard as bytes for HTTP response."""
    vcf_str = generate_vcf(variant=variant, **kwargs)
    return vcf_str.encode(encoding)


def generate_filename(variant: str = "standard", company: str = "Help Assembly") -> str:
    """Generate a clean filename for the VCF download."""
    safe = company.replace(" ", "_").replace(",", "")
    return f"{safe}_{variant}.vcf"


# ─── Direct CLI ──────────────────────────────────────────────────────

if __name__ == "__main__":
    import sys
    v = sys.argv[1] if len(sys.argv) > 1 else "standard"
    print(generate_vcf(variant=v))
