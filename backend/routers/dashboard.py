from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from database import get_db
from auth import require_hr_manager
from models.user import User
from models.employee import Employee
from models.contract import Contract
from models.attendance import Attendance
from models.leave import LeaveRequest, LeaveStatus
from models.payroll import Payrun, Payslip

router = APIRouter()


@router.get("/dashboard/metrics")
@router.get("/metrics")
@router.get("/dashboard")
def get_dashboard_metrics(
    period: Optional[str] = Query(None, description="Payrun period filter in YYYY-MM format"),
    dept: Optional[str] = Query(None, description="Department name or ID filter"),
    department_id: Optional[str] = Query(None, description="Department filter alias"),
    employee_type: Optional[str] = Query(None, description="Employee schedule/employment type filter"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hr_manager),
):
    target_dept = dept or department_id

    # 1. Employee query & headcount
    emp_query = db.query(Employee)
    if target_dept:
        emp_query = emp_query.filter(Employee.department == target_dept)
    employees = emp_query.all()
    total_employees = len(employees)
    active_employees = sum(1 for e in employees if e.is_active)

    # 2. Active contracts count
    contract_query = db.query(Contract).filter(Contract.is_active == True)
    if target_dept:
        contract_query = contract_query.join(Employee).filter(Employee.department == target_dept)
    active_contracts = contract_query.count()

    # 3. Leave Requests metrics
    leave_query = db.query(LeaveRequest)
    if target_dept:
        leave_query = leave_query.join(Employee).filter(Employee.department == target_dept)
    leaves = leave_query.all()
    pending_leaves = sum(1 for l in leaves if l.status == LeaveStatus.PENDING)
    approved_leaves = sum(1 for l in leaves if l.status == LeaveStatus.APPROVED)

    # 4. Attendance metrics
    att_query = db.query(Attendance)
    if target_dept:
        att_query = att_query.join(Employee).filter(Employee.department == target_dept)
    attendances = att_query.all()
    attendance_count = len(attendances)
    total_worked_hours = sum(a.worked_hours or 0.0 for a in attendances)

    # 5. Payslip / Payroll aggregation
    slip_query = db.query(Payslip).join(Payrun).join(Employee, Payslip.employee_id == Employee.id)
    if target_dept:
        slip_query = slip_query.filter(Employee.department == target_dept)
    if period:
        slip_query = slip_query.filter(Payrun.period_start.like(f"{period}%"))

    payslips = slip_query.all()

    total_gross = sum(s.gross for s in payslips)
    total_net = sum(s.net for s in payslips)
    total_deductions = sum(s.deductions for s in payslips)

    by_department: dict = {}
    for slip in payslips:
        dept_name = slip.employee.department or "Unassigned"
        if dept_name not in by_department:
            by_department[dept_name] = {"gross": 0.0, "net": 0.0, "deductions": 0.0, "headcount": 0}
        by_department[dept_name]["gross"] += slip.gross
        by_department[dept_name]["net"] += slip.net
        by_department[dept_name]["deductions"] += slip.deductions
        by_department[dept_name]["headcount"] += 1

    return {
        "summary": {
            "total_employees": total_employees,
            "active_employees": active_employees,
            "active_contracts": active_contracts,
            "pending_leaves": pending_leaves,
            "approved_leaves": approved_leaves,
            "attendance_count": attendance_count,
            "total_worked_hours": round(total_worked_hours, 2),
            "total_gross": round(total_gross, 2),
            "total_net": round(total_net, 2),
            "total_deductions": round(total_deductions, 2),
            "payslip_count": len(payslips),
        },
        "by_department": by_department,
    }
