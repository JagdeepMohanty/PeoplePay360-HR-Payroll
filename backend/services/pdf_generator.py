"""
PDF Generator — High-Performance Production Odoo ERP Payslip Generator
Generates pixel-perfect, executive-grade PDF payslips via ReportLab with embedded Odoo branding.
"""
import io
import json
from pathlib import Path
from datetime import datetime, timezone

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, mm

# Brand colors
ODOO_PLUM = colors.HexColor("#714B67")
ODOO_TEAL = colors.HexColor("#00A09D")
SLATE_DARK = colors.HexColor("#0f172a")
SLATE_MUTED = colors.HexColor("#64748b")
BG_LIGHT = colors.HexColor("#f8fafc")
BORDER_COLOR = colors.HexColor("#e2e8f0")


def generate_payslip_pdf(payslip_data: dict) -> bytes:
    """
    Renders an itemized, executive-grade Odoo ERP payslip PDF in memory and returns raw bytes.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40,
    )

    elements = []
    styles = getSampleStyleSheet()

    # Custom typography styles
    title_style = ParagraphStyle(
        "DocTitle",
        fontName="Helvetica-Bold",
        fontSize=18,
        leading=22,
        textColor=ODOO_PLUM,
    )
    subtitle_style = ParagraphStyle(
        "DocSubTitle",
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        textColor=SLATE_MUTED,
    )
    header_right_style = ParagraphStyle(
        "HeaderRight",
        fontName="Helvetica-Bold",
        fontSize=13,
        leading=16,
        alignment=2, # Right aligned
        textColor=SLATE_DARK,
    )
    header_right_sub = ParagraphStyle(
        "HeaderRightSub",
        fontName="Helvetica",
        fontSize=9,
        leading=13,
        alignment=2,
        textColor=SLATE_MUTED,
    )
    label_style = ParagraphStyle(
        "LabelStyle",
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=11,
        textColor=SLATE_MUTED,
    )
    val_style = ParagraphStyle(
        "ValStyle",
        fontName="Helvetica-Bold",
        fontSize=9.5,
        leading=13,
        textColor=SLATE_DARK,
    )
    table_header_style = ParagraphStyle(
        "THeader",
        fontName="Helvetica-Bold",
        fontSize=9,
        leading=12,
        textColor=colors.white,
    )
    table_cell_style = ParagraphStyle(
        "TCell",
        fontName="Helvetica",
        fontSize=9,
        leading=13,
        textColor=SLATE_DARK,
    )
    table_cell_bold = ParagraphStyle(
        "TCellBold",
        fontName="Helvetica-Bold",
        fontSize=9,
        leading=13,
        textColor=SLATE_DARK,
    )
    net_val_style = ParagraphStyle(
        "NetVal",
        fontName="Helvetica-Bold",
        fontSize=16,
        leading=20,
        alignment=2,
        textColor=ODOO_PLUM,
    )

    # 1. Header with Logo and Company Info
    emp_name = payslip_data.get("employee_name", "Valued Employee")
    dept = payslip_data.get("department", "General")
    period_start = payslip_data.get("period_start", "")
    period_end = payslip_data.get("period_end", "")
    period_str = f"{period_start} to {period_end}" if period_start else "Current Pay Period"

    # Logo element
    logo_img = Paragraph("<font color='#714B67'><b>PeoplePay360</b></font>", title_style)

    header_left = [
        logo_img,
        Spacer(1, 4),
        Paragraph("Enterprise Payroll & Workforce ERP", subtitle_style),
        Paragraph("People Technology Systems", label_style),
    ]

    header_right = [
        Paragraph("CONFIDENTIAL SALARY PAYSLIP", header_right_style),
        Paragraph(f"Pay Period: <b>{period_str}</b>", header_right_sub),
        Paragraph(f"Issue Date: {datetime.now(timezone.utc).strftime('%d %b %Y')}", header_right_sub),
        Paragraph("Disbursement Status: <b>FINALIZED</b>", header_right_sub),
    ]

    header_table = Table(
        [[header_left, header_right]],
        colWidths=[280, 235]
    )
    header_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
    ]))
    elements.append(header_table)
    elements.append(HRFlowable(width="100%", thickness=1.5, color=ODOO_PLUM, spaceBefore=4, spaceAfter=14))

    # 2. Employee Metadata Card
    bank_acc = payslip_data.get("bank_account", "GB29NWBK60161331926819") or "Registered Corporate Direct Deposit"
    emp_grid = [
        [
            Paragraph("EMPLOYEE NAME", label_style),
            Paragraph(emp_name, val_style),
            Paragraph("DEPARTMENT", label_style),
            Paragraph(dept, val_style),
        ],
        [
            Paragraph("PAYROLL CYCLE", label_style),
            Paragraph("Monthly Regular", val_style),
            Paragraph("BANK / IBAN", label_style),
            Paragraph(str(bank_acc), val_style),
        ],
        [
            Paragraph("CURRENCY", label_style),
            Paragraph("INR (Indian Rupee - ₹)", val_style),
            Paragraph("PAYMENT MODE", label_style),
            Paragraph("Electronic NEFT / IMPS", val_style),
        ]
    ]
    meta_table = Table(emp_grid, colWidths=[105, 155, 105, 150])
    meta_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), BG_LIGHT),
        ("BOX", (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    elements.append(meta_table)
    elements.append(Spacer(1, 16))

    # 3. Itemized Earnings & Deductions Breakdown
    basic_val = float(payslip_data.get("basic_pay", 0.0) or 0.0)
    allowance_val = float(payslip_data.get("allowances", 0.0) or 0.0)
    gross_val = float(payslip_data.get("gross", basic_val + allowance_val) or (basic_val + allowance_val))
    deductions_val = float(payslip_data.get("deductions", 0.0) or 0.0)
    net_val = float(payslip_data.get("net_pay", gross_val - deductions_val) or (gross_val - deductions_val))

    # Parse breakdown if present
    breakdown = payslip_data.get("breakdown")
    if isinstance(breakdown, str):
        try:
            breakdown = json.loads(breakdown)
        except Exception:
            breakdown = {}
    elif not isinstance(breakdown, dict):
        breakdown = {}

    tax_val = breakdown.get("INCOME_TAX", gross_val * 0.07)
    ss_val = breakdown.get("SOCIAL_SEC", gross_val * 0.03)
    lop_val = breakdown.get("LOP_DEDUCTION", max(0.0, deductions_val - (tax_val + ss_val)))

    items_data = [
        [
            Paragraph("EARNINGS & ALLOWANCES", table_header_style),
            Paragraph("AMOUNT (INR)", ParagraphStyle("TH2", parent=table_header_style, alignment=2)),
            Paragraph("DEDUCTIONS & WITHHOLDINGS", table_header_style),
            Paragraph("AMOUNT (INR)", ParagraphStyle("TH3", parent=table_header_style, alignment=2)),
        ],
        [
            Paragraph("Basic Monthly Salary", table_cell_style),
            Paragraph(f"₹{basic_val:,.2f}", ParagraphStyle("C1", parent=table_cell_style, alignment=2)),
            Paragraph("Provident Fund / Income Tax (7%)", table_cell_style),
            Paragraph(f"₹{tax_val:,.2f}", ParagraphStyle("C2", parent=table_cell_style, alignment=2)),
        ],
        [
            Paragraph("Housing & Transport Allowance (15%)", table_cell_style),
            Paragraph(f"₹{allowance_val:,.2f}", ParagraphStyle("C3", parent=table_cell_style, alignment=2)),
            Paragraph("Social Security & Medical (3%)", table_cell_style),
            Paragraph(f"₹{ss_val:,.2f}", ParagraphStyle("C4", parent=table_cell_style, alignment=2)),
        ],
        [
            Paragraph("Special Performance Stipend", table_cell_style),
            Paragraph("₹0.00", ParagraphStyle("C5", parent=table_cell_style, alignment=2)),
            Paragraph("Loss of Pay (LOP Deductions)", table_cell_style),
            Paragraph(f"₹{lop_val:,.2f}", ParagraphStyle("C6", parent=table_cell_style, alignment=2)),
        ],
        [
            Paragraph("<b>TOTAL GROSS EARNINGS</b>", table_cell_bold),
            Paragraph(f"<b>₹{gross_val:,.2f}</b>", ParagraphStyle("C7", parent=table_cell_bold, alignment=2)),
            Paragraph("<b>TOTAL DEDUCTIONS</b>", table_cell_bold),
            Paragraph(f"<b>₹{deductions_val:,.2f}</b>", ParagraphStyle("C8", parent=table_cell_bold, alignment=2)),
        ],
    ]

    items_table = Table(items_data, colWidths=[175, 80, 180, 80])
    items_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), ODOO_PLUM),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("BACKGROUND", (0, 1), (-1, 3), colors.white),
        ("BACKGROUND", (0, 4), (-1, 4), BG_LIGHT),
        ("BOX", (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ("LINEBELOW", (0, 0), (-1, 0), 1, ODOO_PLUM),
    ]))
    elements.append(items_table)
    elements.append(Spacer(1, 14))

    # 4. Net Salary Highlight Banner
    net_box_data = [
        [
            Paragraph("<b>TOTAL NET PAYABLE SALARY (TAKE-HOME)</b><br/><font size=8 color='#64748b'>Disbursed directly to registered employee account</font>", ParagraphStyle("NetL", fontName="Helvetica", fontSize=10, leading=14, textColor=SLATE_DARK)),
            Paragraph(f"₹{net_val:,.2f}", net_val_style),
        ]
    ]
    net_table = Table(net_box_data, colWidths=[315, 200])
    net_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f3e8f0")), # Soft Odoo plum tint
        ("BOX", (0, 0), (-1, -1), 1, ODOO_PLUM),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    elements.append(net_table)
    elements.append(Spacer(1, 28))

    # 5. Authorization & Verification Signatures
    sig_data = [
        [
            Paragraph("<b>HR & Payroll Administration</b><br/><font size=7 color='#64748b'>PeoplePay360 Authorized Signatory</font>", label_style),
            Paragraph("<b>Finance & Accounts Controller</b><br/><font size=7 color='#64748b'>Approved & Audited</font>", label_style),
            Paragraph("<b>Employee Confirmation</b><br/><font size=7 color='#64748b'>Digital Acknowledgment</font>", label_style),
        ],
        [
            Paragraph("____________________________<br/>Marc Demo (HR Manager)", label_style),
            Paragraph("____________________________<br/>Amit Saxena (Finance Controller)", label_style),
            Paragraph(f"____________________________<br/>{emp_name}", label_style),
        ]
    ]
    sig_table = Table(sig_data, colWidths=[175, 175, 165])
    sig_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 1), (-1, 1), 20),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
    ]))
    elements.append(KeepTogether([sig_table]))

    # Footer note
    elements.append(Spacer(1, 24))
    elements.append(Paragraph(
        "<i>Note: This is a system-generated secure document from PeoplePay360. No physical signature is required. For inquiries, contact payroll@peoplepay360.dev.</i>",
        ParagraphStyle("FooterNote", fontName="Helvetica-Oblique", fontSize=7.5, leading=10, alignment=1, textColor=SLATE_MUTED)
    ))

    # Build PDF
    doc.build(elements)
    return buffer.getvalue()
