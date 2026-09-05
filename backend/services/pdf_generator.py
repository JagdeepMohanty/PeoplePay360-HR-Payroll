"""
PDF Generator
Renders a Jinja2 HTML payslip template to PDF bytes via WeasyPrint,
with a fallback mechanism if native GTK/WeasyPrint libraries are missing on Windows.
"""
import json
from pathlib import Path
from jinja2 import Environment, FileSystemLoader, select_autoescape

TEMPLATE_DIR = Path(__file__).parent.parent / "templates"

try:
    from weasyprint import HTML
    WEASYPRINT_AVAILABLE = True
except Exception:
    WEASYPRINT_AVAILABLE = False


def _generate_fallback_pdf(html_content: str, payslip_data: dict) -> bytes:
    """
    Fallback PDF generator when GTK/Pango C-libraries for WeasyPrint are not present on Windows.
    Produces a valid PDF header and formatted text payload.
    """
    emp_name = payslip_data.get("employee_name", "Employee")
    period = f"{payslip_data.get('period_start', '')} to {payslip_data.get('period_end', '')}"
    net = payslip_data.get("net_pay", 0.0)
    basic = payslip_data.get("basic_pay", 0.0)
    allow = payslip_data.get("allowances", 0.0)
    gross = payslip_data.get("gross", 0.0)
    ded = payslip_data.get("deductions", 0.0)

    summary_text = (
        f"PEOPLEPAY360 PAYSLIP SUMMARY\n"
        f"Employee: {emp_name}\n"
        f"Department: {payslip_data.get('department', '')}\n"
        f"Pay Period: {period}\n"
        f"----------------------------------------\n"
        f"Basic Pay:  {basic:.2f}\n"
        f"Allowances: {allow:.2f}\n"
        f"Gross Pay:  {gross:.2f}\n"
        f"Deductions: {ded:.2f}\n"
        f"NET PAY:    {net:.2f}\n"
        f"----------------------------------------\n"
    )

    pdf_content = (
        "%PDF-1.4\n"
        "1 0 obj <</Type /Catalog /Pages 2 0 R>> endobj\n"
        "2 0 obj <</Type /Pages /Kids [3 0 R] /Count 1>> endobj\n"
        "3 0 obj <</Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources <</Font <</F1 5 0 R>>>>>> endobj\n"
        "4 0 obj <</Length " + str(len(summary_text) + 50) + ">> stream\n"
        "BT /F1 12 Tf 50 700 Td (" + summary_text.replace("\n", ") Tj T* (") + ") Tj ET\n"
        "endstream\n"
        "endobj\n"
        "5 0 obj <</Type /Font /Subtype /Type1 /BaseFont /Helvetica>> endobj\n"
        "xref\n0 6\n"
        "0000000000 65535 f \n"
        "0000000009 00000 n \n"
        "0000000058 00000 n \n"
        "0000000115 00000 n \n"
        "0000000244 00000 n \n"
        "0000000400 00000 n \n"
        "trailer <</Size 6 /Root 1 0 R>>\n"
        "startxref\n470\n%%EOF"
    )
    return pdf_content.encode("latin-1", errors="replace")


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
        try:
            payslip_data["breakdown"] = json.loads(payslip_data["breakdown"])
        except Exception:
            payslip_data["breakdown"] = {}

    html_content = template.render(**payslip_data)

    if WEASYPRINT_AVAILABLE:
        try:
            return HTML(string=html_content, base_url=str(TEMPLATE_DIR)).write_pdf()
        except Exception:
            return _generate_fallback_pdf(html_content, payslip_data)
    else:
        return _generate_fallback_pdf(html_content, payslip_data)
