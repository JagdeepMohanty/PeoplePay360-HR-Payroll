"""
PDF Generator
Renders a Jinja2 HTML payslip template to PDF binary streams.
Supports WeasyPrint and ReportLab with fallback generation.
"""
import io
import json
from pathlib import Path
from jinja2 import Environment, FileSystemLoader, select_autoescape

TEMPLATE_DIR = Path(__file__).parent.parent / "templates"

try:
    from weasyprint import HTML
    WEASYPRINT_AVAILABLE = True
except Exception:
    WEASYPRINT_AVAILABLE = False

try:
    from reportlab.lib.pagesizes import letter
    from reportlab.lib import colors
    from reportlab.platypus import (
        SimpleDocTemplate,
        Paragraph,
        Spacer,
        Table,
        TableStyle,
        HRFlowable,
    )
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    REPORTLAB_AVAILABLE = True
except Exception:
    REPORTLAB_AVAILABLE = False


def _generate_reportlab_pdf(payslip_data: dict) -> bytes:
    """
    Generate professional payslip PDF binary stream using ReportLab.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36,
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Heading1"],
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#1e40af"),
        fontName="Helvetica-Bold",
    )
    subtitle_style = ParagraphStyle(
        "SubTitle",
        parent=styles["Normal"],
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#64748b"),
    )
    badge_style = ParagraphStyle(
        "Badge",
        parent=styles["Normal"],
        fontSize=11,
        leading=14,
        textColor=colors.HexColor("#1d4ed8"),
        alignment=2,  # Right
        fontName="Helvetica-Bold",
    )
    meta_style = ParagraphStyle(
        "MetaRight",
        parent=styles["Normal"],
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#64748b"),
        alignment=2,
    )
    section_heading = ParagraphStyle(
        "SectionHeading",
        parent=styles["Heading2"],
        fontSize=11,
        leading=14,
        textColor=colors.HexColor("#0f172a"),
        fontName="Helvetica-Bold",
        spaceAfter=6,
    )
    cell_bold = ParagraphStyle(
        "CellBold",
        parent=styles["Normal"],
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#0f172a"),
        fontName="Helvetica-Bold",
    )
    cell_normal = ParagraphStyle(
        "CellNormal",
        parent=styles["Normal"],
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#334155"),
    )
    cell_deduction = ParagraphStyle(
        "CellDeduction",
        parent=styles["Normal"],
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#dc2626"),
        alignment=2,
    )
    cell_right = ParagraphStyle(
        "CellRight",
        parent=styles["Normal"],
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#0f172a"),
        alignment=2,
        fontName="Helvetica-Bold",
    )
    net_style = ParagraphStyle(
        "NetStyle",
        parent=styles["Normal"],
        fontSize=18,
        leading=22,
        textColor=colors.HexColor("#1d4ed8"),
        alignment=2,
        fontName="Helvetica-Bold",
    )

    story = []

    # 1. Header Table
    header_data = [
        [
            Paragraph("<b>PeoplePay360</b>", title_style),
            Paragraph("OFFICIAL PAYSLIP", badge_style),
        ],
        [
            Paragraph("Enterprise Workforce-to-Payroll Management", subtitle_style),
            Paragraph(f"Period: {payslip_data.get('period_start')} &ndash; {payslip_data.get('period_end')}", meta_style),
        ],
    ]
    t_header = Table(header_data, colWidths=[320, 220])
    t_header.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
    ]))
    story.append(t_header)
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor("#2563eb"), spaceAfter=14))

    # 2. Employee and Period Details Table
    emp_name = payslip_data.get("employee_name", "Employee")
    emp_id = payslip_data.get("employee_id", "—")
    dept = payslip_data.get("department") or "General"
    email = payslip_data.get("email") or "—"
    bank = payslip_data.get("bank_account") or "On File"
    p_start = payslip_data.get("period_start", "")
    p_end = payslip_data.get("period_end", "")
    worked_days = payslip_data.get("worked_days", 22.0)
    basic = payslip_data.get("basic_pay", 0.0)

    info_data = [
        [
            Paragraph("<b>EMPLOYEE PROFILE</b>", cell_bold),
            Paragraph("", cell_normal),
            Paragraph("<b>PAY PERIOD DETAILS</b>", cell_bold),
            Paragraph("", cell_normal),
        ],
        [
            Paragraph("Full Name:", cell_normal),
            Paragraph(emp_name, cell_bold),
            Paragraph("Period Start:", cell_normal),
            Paragraph(str(p_start), cell_bold),
        ],
        [
            Paragraph("Employee ID:", cell_normal),
            Paragraph(f"#{emp_id}", cell_bold),
            Paragraph("Period End:", cell_normal),
            Paragraph(str(p_end), cell_bold),
        ],
        [
            Paragraph("Department:", cell_normal),
            Paragraph(str(dept), cell_bold),
            Paragraph("Worked Days:", cell_normal),
            Paragraph(f"{worked_days} days", cell_bold),
        ],
        [
            Paragraph("Bank Account:", cell_normal),
            Paragraph(str(bank), cell_bold),
            Paragraph("Base Wage:", cell_normal),
            Paragraph(f"${basic:,.2f}", cell_bold),
        ],
    ]

    t_info = Table(info_data, colWidths=[90, 170, 90, 190])
    t_info.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#e2e8f0")),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#f1f5f9")),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LINEBELOW", (0, 0), (-1, 0), 1, colors.HexColor("#cbd5e1")),
    ]))
    story.append(t_info)
    story.append(Spacer(1, 14))

    # 3. Itemized Salary Rules Breakdown
    story.append(Paragraph("<b>ITEMIZED SALARY RULES BREAKDOWN</b>", section_heading))

    breakdown = payslip_data.get("breakdown") or {}
    gross = payslip_data.get("gross", 0.0)
    net = payslip_data.get("net_pay", 0.0)
    allow = payslip_data.get("allowances", 0.0)
    ded = payslip_data.get("deductions", 0.0)

    housing = breakdown.get("2_Housing_Allowance", round(basic * 0.10, 2))
    transport = breakdown.get("2_Transport_Allowance", round(basic * 0.05, 2))
    lop_days = breakdown.get("4_LOP_Days", 0)
    lop_ded = breakdown.get("4_LOP_Deduction", 0.0)
    daily_rate = breakdown.get("4_Daily_Rate", 0.0)
    tax = breakdown.get("5_Income_Tax", round(gross * 0.07, 2))
    soc_sec = breakdown.get("6_Social_Security", round(gross * 0.03, 2))

    rules_table_data = [
        [
            Paragraph("<b>Category</b>", cell_bold),
            Paragraph("<b>Rule Code</b>", cell_bold),
            Paragraph("<b>Description</b>", cell_bold),
            Paragraph("<b>Amount</b>", cell_right),
        ],
        [
            Paragraph("BASIC", cell_normal),
            Paragraph("BASIC", cell_normal),
            Paragraph("Base Monthly Wage", cell_normal),
            Paragraph(f"${basic:,.2f}", cell_right),
        ],
        [
            Paragraph("ALLOWANCE", cell_normal),
            Paragraph("HOUSING", cell_normal),
            Paragraph("Housing Allowance (10%)", cell_normal),
            Paragraph(f"${housing:,.2f}", cell_right),
        ],
        [
            Paragraph("ALLOWANCE", cell_normal),
            Paragraph("TRANSPORT", cell_normal),
            Paragraph("Transport Allowance (5%)", cell_normal),
            Paragraph(f"${transport:,.2f}", cell_right),
        ],
        [
            Paragraph("<b>GROSS</b>", cell_bold),
            Paragraph("<b>GROSS</b>", cell_bold),
            Paragraph("<b>Gross Earnings Subtotal</b>", cell_bold),
            Paragraph(f"<b>${gross:,.2f}</b>", cell_right),
        ],
    ]

    if lop_days > 0:
        rules_table_data.append([
            Paragraph("DEDUCTION", cell_normal),
            Paragraph("LOP", cell_normal),
            Paragraph(f"Loss of Pay ({lop_days} day(s) @ ${daily_rate:.2f}/day)", cell_normal),
            Paragraph(f"-${lop_ded:,.2f}", cell_deduction),
        ])

    rules_table_data.extend([
        [
            Paragraph("DEDUCTION", cell_normal),
            Paragraph("TAX", cell_normal),
            Paragraph("Income Tax Withholding (7%)", cell_normal),
            Paragraph(f"-${tax:,.2f}", cell_deduction),
        ],
        [
            Paragraph("DEDUCTION", cell_normal),
            Paragraph("SOC_SEC", cell_normal),
            Paragraph("Social Security Contribution (3%)", cell_normal),
            Paragraph(f"-${soc_sec:,.2f}", cell_deduction),
        ],
        [
            Paragraph("<b>NET</b>", cell_bold),
            Paragraph("<b>NET_PAY</b>", cell_bold),
            Paragraph("<b>Total Take-Home Pay</b>", cell_bold),
            Paragraph(f"<b>${net:,.2f}</b>", cell_right),
        ],
    ])

    t_rules = Table(rules_table_data, colWidths=[90, 80, 250, 120])
    table_style_commands = [
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e40af")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("BACKGROUND", (0, 4), (-1, 4), colors.HexColor("#eff6ff")),  # Gross row
        ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#f0fdf4")),  # Net row
    ]
    t_rules.setStyle(TableStyle(table_style_commands))
    story.append(t_rules)
    story.append(Spacer(1, 16))

    # 4. Net Pay Callout Summary
    summary_data = [
        [
            Paragraph("<b>CONFIDENTIAL DOCUMENT</b><br/><font color='#64748b' size='8'>This official payslip is generated by PeoplePay360 for authorized employee verification only.</font>", cell_normal),
            Paragraph("<b>TOTAL NET PAYABLE</b>", ParagraphStyle("LabelR", parent=cell_normal, alignment=2, textColor=colors.HexColor("#64748b"))),
        ],
        [
            Paragraph("", cell_normal),
            Paragraph(f"${net:,.2f}", net_style),
        ],
    ]
    t_summary = Table(summary_data, colWidths=[360, 180])
    t_summary.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ("BOX", (0, 0), (-1, -1), 1.5, colors.HexColor("#2563eb")),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
    ]))
    story.append(t_summary)
    story.append(Spacer(1, 20))

    # 5. Footer
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#e2e8f0"), spaceAfter=8))
    footer_data = [
        [
            Paragraph(f"PeoplePay360 &bull; Generated: {p_end} &bull; System Verified", subtitle_style),
            Paragraph("Strictly Confidential", meta_style),
        ]
    ]
    t_footer = Table(footer_data, colWidths=[380, 160])
    story.append(t_footer)

    doc.build(story)
    return buffer.getvalue()


def _generate_fallback_pdf(html_content: str, payslip_data: dict) -> bytes:
    """
    Fallback basic PDF writer.
    """
    emp_name = payslip_data.get("employee_name", "Employee")
    period = f"{payslip_data.get('period_start', '')} to {payslip_data.get('period_end', '')}"
    net = payslip_data.get("net_pay", 0.0)
    basic = payslip_data.get("basic_pay", 0.0)
    allow = payslip_data.get("allowances", 0.0)
    gross = payslip_data.get("gross", 0.0)
    ded = payslip_data.get("deductions", 0.0)

    summary_text = (
        f"PEOPLEPAY360 OFFICIAL PAYSLIP\\n"
        f"Employee: {emp_name}\\n"
        f"Department: {payslip_data.get('department', '')}\\n"
        f"Pay Period: {period}\\n"
        f"----------------------------------------\\n"
        f"Basic Pay:  {basic:.2f}\\n"
        f"Allowances: {allow:.2f}\\n"
        f"Gross Pay:  {gross:.2f}\\n"
        f"Deductions: {ded:.2f}\\n"
        f"NET PAY:    {net:.2f}\\n"
        f"----------------------------------------\\n"
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
        employee_name, employee_id, email, department, bank_account,
        period_start, period_end, worked_days, basic_pay, allowances,
        gross, deductions, net_pay, breakdown (str|dict)
    Returns raw PDF bytes.
    """
    # Parse breakdown if string
    if isinstance(payslip_data.get("breakdown"), str):
        try:
            payslip_data["breakdown"] = json.loads(payslip_data["breakdown"])
        except Exception:
            payslip_data["breakdown"] = {}

    # 1. Render Jinja2 HTML template
    env = Environment(
        loader=FileSystemLoader(str(TEMPLATE_DIR)),
        autoescape=select_autoescape(["html"]),
    )
    template = env.get_template("payslip.html")
    html_content = template.render(**payslip_data)

    # 2. Prefer WeasyPrint if available and working
    if WEASYPRINT_AVAILABLE:
        try:
            return HTML(string=html_content, base_url=str(TEMPLATE_DIR)).write_pdf()
        except Exception:
            pass

    # 3. Use ReportLab to generate valid, styled PDF binary stream
    if REPORTLAB_AVAILABLE:
        try:
            return _generate_reportlab_pdf(payslip_data)
        except Exception:
            pass

    # 4. Fallback generator
    return _generate_fallback_pdf(html_content, payslip_data)
