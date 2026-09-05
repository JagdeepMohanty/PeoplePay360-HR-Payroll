from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from database import get_db
from models.payroll import Payrun, Payslip
from models.employee import Employee

router = APIRouter()


@router.get("/dashboard")
def get_dashboard(
    dept: str | None = Query(None),
    period: str | None = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(Payslip).join(Payrun).join(Employee, Payslip.employee_id == Employee.id)

    if dept:
        query = query.filter(Employee.department == dept)
    if period:
        query = query.filter(Payrun.period_start.like(f"{period}%"))

    payslips = query.all()

    total_gross = sum(s.gross for s in payslips)
    total_net = sum(s.net_pay for s in payslips)
    total_deductions = sum(s.deductions for s in payslips)

    by_department: dict = {}
    for slip in payslips:
        dept_name = slip.employee.department or "Unassigned"
        if dept_name not in by_department:
            by_department[dept_name] = {"gross": 0.0, "net": 0.0, "headcount": 0}
        by_department[dept_name]["gross"] += slip.gross
        by_department[dept_name]["net"] += slip.net_pay
        by_department[dept_name]["headcount"] += 1

    return {
        "total_gross": round(total_gross, 2),
        "total_net": round(total_net, 2),
        "total_deductions": round(total_deductions, 2),
        "headcount": len(payslips),
        "by_department": by_department,
    }
