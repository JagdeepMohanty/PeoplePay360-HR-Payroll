"""
Payroll Guardian Validator
Runs pre-confirmation anomaly checks and surfaces actionable warnings:
1. Missing employee bank account details
2. Overlapping active contracts
3. Duplicate payslips (within batch or across overlapping periods)
"""
from typing import List, Optional
from sqlalchemy import or_
from models.employee import Employee
from models.contract import Contract
from models.payroll import Payrun, Payslip


def validate_payrun(db, payrun_id: int, employee_ids: Optional[List[int]] = None) -> list[dict]:
    warnings = []

    payrun = db.query(Payrun).filter(Payrun.id == payrun_id).first()
    if not payrun:
        return warnings

    # If employee_ids not provided, resolve from existing payslips or eligible active contracts
    if not employee_ids:
        existing_slips = db.query(Payslip.employee_id).filter(Payslip.payrun_id == payrun_id).all()
        if existing_slips:
            employee_ids = list({s[0] for s in existing_slips})
        else:
            eligible_contracts = db.query(Contract.employee_id).filter(
                Contract.is_active == True,
                Contract.date_start <= payrun.period_end,
                or_(Contract.date_end >= payrun.period_start, Contract.date_end.is_(None)),
            ).all()
            employee_ids = list({c[0] for c in eligible_contracts})

    seen_types = set()

    for emp_id in employee_ids:
        employee = db.query(Employee).filter(Employee.id == emp_id).first()
        if not employee:
            continue

        emp_name = employee.full_name

        # Check 1: Missing bank account details
        if not employee.bank_account or not str(employee.bank_account).strip():
            warn_key = (emp_id, "missing_bank_account")
            if warn_key not in seen_types:
                seen_types.add(warn_key)
                warnings.append({
                    "employee_id": emp_id,
                    "employee_name": emp_name,
                    "type": "missing_bank_account",
                    "message": f"{emp_name} has no bank account on file.",
                })

        # Check 2: Overlapping contracts
        # Condition A: Multiple active contracts overlapping the payrun period
        overlapping_in_period = (
            db.query(Contract)
            .filter(
                Contract.employee_id == emp_id,
                Contract.is_active == True,
                Contract.date_start <= payrun.period_end,
                or_(Contract.date_end >= payrun.period_start, Contract.date_end.is_(None)),
            )
            .all()
        )
        if len(overlapping_in_period) > 1:
            warn_key = (emp_id, "overlapping_contracts")
            if warn_key not in seen_types:
                seen_types.add(warn_key)
                warnings.append({
                    "employee_id": emp_id,
                    "employee_name": emp_name,
                    "type": "overlapping_contracts",
                    "message": f"{emp_name} has {len(overlapping_in_period)} overlapping active contracts in period {payrun.period_start} to {payrun.period_end}.",
                })

        # Condition B: Multiple active contracts with mutual date overlap
        all_active_contracts = (
            db.query(Contract)
            .filter(Contract.employee_id == emp_id, Contract.is_active == True)
            .all()
        )
        if len(all_active_contracts) > 1 and (emp_id, "overlapping_contracts") not in seen_types:
            for i in range(len(all_active_contracts)):
                for j in range(i + 1, len(all_active_contracts)):
                    c1, c2 = all_active_contracts[i], all_active_contracts[j]
                    c1_end = c1.date_end or "9999-12-31"
                    c2_end = c2.date_end or "9999-12-31"
                    if c1.date_start <= c2_end and c2.date_start <= c1_end:
                        warn_key = (emp_id, "overlapping_contracts")
                        if warn_key not in seen_types:
                            seen_types.add(warn_key)
                            warnings.append({
                                "employee_id": emp_id,
                                "employee_name": emp_name,
                                "type": "overlapping_contracts",
                                "message": f"{emp_name} has overlapping active contracts (#{c1.id} and #{c2.id}).",
                            })
                        break

        # Check 3: Duplicate payslips
        # A: Intra-payrun duplicate
        current_dups = (
            db.query(Payslip)
            .filter(Payslip.employee_id == emp_id, Payslip.payrun_id == payrun_id)
            .count()
        )
        if current_dups > 1:
            warn_key = (emp_id, "duplicate_payslip")
            if warn_key not in seen_types:
                seen_types.add(warn_key)
                warnings.append({
                    "employee_id": emp_id,
                    "employee_name": emp_name,
                    "type": "duplicate_payslip",
                    "message": f"{emp_name} has duplicate payslips in this payrun batch.",
                })

        # B: Cross-payrun duplicate (another payrun already covers an overlapping period)
        cross_dups = (
            db.query(Payslip)
            .join(Payrun, Payslip.payrun_id == Payrun.id)
            .filter(
                Payslip.employee_id == emp_id,
                Payslip.payrun_id != payrun_id,
                Payrun.period_start <= payrun.period_end,
                Payrun.period_end >= payrun.period_start,
            )
            .all()
        )
        if cross_dups:
            warn_key = (emp_id, "duplicate_payslip_cross")
            if warn_key not in seen_types:
                seen_types.add(warn_key)
                other_pr_id = cross_dups[0].payrun_id
                warnings.append({
                    "employee_id": emp_id,
                    "employee_name": emp_name,
                    "type": "duplicate_payslip",
                    "message": f"{emp_name} already has a payslip in overlapping payrun #{other_pr_id}.",
                })

    return warnings
