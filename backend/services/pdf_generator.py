"""
PDF Generator
Renders a Jinja2 HTML payslip template to PDF bytes via WeasyPrint.
"""
import json
from pathlib import Path
from jinja2 import Environment, FileSystemLoader, select_autoescape
from weasyprint import HTML

TEMPLATE_DIR = Path(__file__).parent.parent / "templates"


def generate_payslip_pdf(payslip_data: dict) -> bytes:
    """
    Accepts a flat dict with keys:
        employee_name, department, period_start, period_end,
        basic_pay, allowances, gross, deductions, net_pay, breakdown (str|dict)
    Returns raw PDF bytes.
    """
    env = Environment(
        loader=FileSystemLoader(str(TEMPLATE_DIR)),
        autoescape=select_autoescape(["html"]),
    )
    template = env.get_template("payslip.html")

    if isinstance(payslip_data.get("breakdown"), str):
        payslip_data["breakdown"] = json.loads(payslip_data["breakdown"])

    html_content = template.render(**payslip_data)
    return HTML(string=html_content, base_url=str(TEMPLATE_DIR)).write_pdf()
