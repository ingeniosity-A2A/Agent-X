"""
Appless — Mobile Care via Contact Card (VCF/vCard)

No app needed. Customer saves a contact card → gets a direct line to service.
The contact's URL field points to a web endpoint for instant care.
"""

from .vcf_generator import generate_vcf, generate_vcf_bytes
from .server import create_app

__all__ = ["generate_vcf", "generate_vcf_bytes", "create_app"]
