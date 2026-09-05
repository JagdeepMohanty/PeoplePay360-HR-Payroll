"""
Unit Tests — Salary Engine
Covers:
  - get_period_working_days() across months with 19, 20, 21, 22, and 23 working days
  - Decimal precision (no floating-point drift)
  - LOP daily rate accuracy per calendar month
  - WorkingSchedule interval overrides (non-standard Mon–Sat, Sun–Thu)
  - compute_payslip() end-to-end with mocked DB session
"""
import json
import sys
import os
from decimal import Decimal
from unittest.mock import MagicMock, patch, PropertyMock

import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from services.salary_engine import (
    get_period_working_days,
    _d,
    _round2,
    _calc_lop_days,
    compute_payslip,
)


# ===========================================================================
# Helpers
# ===========================================================================

def _make_interval(day_of_week: int):
    """Create a mock WorkScheduleInterval for a given weekday (0=Mon, 6=Sun)."""
    iv = MagicMock()
    iv.day_of_week = day_of_week
    iv.start_time = "09:00"
    iv.end_time = "18:00"
    iv.break_hours = 1.0
    return iv


def _make_contract(wage: float, employee=None):
    c = MagicMock()
    c.wage = wage
    c.is_active = True
    c.date_start = "2020-01-01"
    c.date_end = None
    c.salary_structure_id = None
    c.employee = employee or MagicMock(working_schedule_id=None)
    return c


def _make_payslip(employee_id: int = 1):
    slip = MagicMock()
    slip.employee_id = employee_id
    slip.contract_id = None
    slip.basic = 0.0
    slip.allowances = 0.0
    slip.gross = 0.0
    slip.deductions = 0.0
    slip.net = 0.0
    slip.worked_days = 0.0
    slip.breakdown_json = "{}"
    return slip


# ===========================================================================
# 1. get_period_working_days — standard Mon–Fri
# ===========================================================================

class TestGetPeriodWorkingDays:

    def test_19_working_days(self):
        # February 2015: 28 days, starts Sunday → 19 Mon–Fri days
        assert get_period_working_days("2015-02-01", "2015-02-28") == 19

    def test_20_working_days(self):
        # February 2026: 28 days, starts Sunday → 20 Mon–Fri days
        assert get_period_working_days("2026-02-01", "2026-02-28") == 20

    def test_21_working_days(self):
        # March 2025: 31 days → 21 Mon–Fri days
        assert get_period_working_days("2025-03-01", "2025-03-31") == 21

    def test_22_working_days(self):
        # July 2025: 31 days → 23 Mon–Fri days — use June 2025 for 21
        # April 2019: 30 days, starts Monday → 22 Mon–Fri days
        assert get_period_working_days("2019-04-01", "2019-04-30") == 22

    def test_23_working_days(self):
        # July 2025: 31 days, starts Tuesday → 23 Mon–Fri days
        assert get_period_working_days("2025-07-01", "2025-07-31") == 23

    def test_single_day_monday(self):
        # 2025-07-07 is a Monday
        assert get_period_working_days("2025-07-07", "2025-07-07") == 1

    def test_single_day_saturday(self):
        # 2025-07-05 is a Saturday — no working days, but minimum guard returns 1
        assert get_period_working_days("2025-07-05", "2025-07-05") == 1

    def test_full_week(self):
        # Mon 2025-07-07 to Sun 2025-07-13 → 5 working days
        assert get_period_working_days("2025-07-07", "2025-07-13") == 5

    def test_february_leap_year(self):
        # February 2028 (leap): 29 days, starts Tuesday → 21 Mon–Fri days
        assert get_period_working_days("2028-02-01", "2028-02-29") == 21


# ===========================================================================
# 2. get_period_working_days — WorkingSchedule overrides
# ===========================================================================

class TestWorkingScheduleOverrides:

    def test_mon_to_sat_schedule(self):
        # Mon–Sat (0–5) for July 2025 (31 days)
        intervals = [_make_interval(d) for d in range(6)]  # Mon=0 … Sat=5
        result = get_period_working_days("2025-07-01", "2025-07-31", intervals)
        # July 2025: 4 full weeks (24 Mon–Sat days) + 3 extra days (Wed 30, Thu 31 + Tue 1)
        # Exact: count manually — result should be 27
        assert result == 27

    def test_sun_thu_schedule(self):
        # Sun–Thu (6, 0, 1, 2, 3) — Middle-East work week
        intervals = [_make_interval(d) for d in [6, 0, 1, 2, 3]]
        result = get_period_working_days("2025-07-01", "2025-07-31", intervals)
        # July 2025: 4 Sundays + 5 Mon + 5 Tue + 5 Wed + 4 Thu = 23
        assert result == 23

    def test_four_day_week(self):
        # Mon–Thu only (0–3)
        intervals = [_make_interval(d) for d in range(4)]
        result = get_period_working_days("2025-07-01", "2025-07-31", intervals)
        # July 2025: 5 Mon + 5 Tue + 5 Wed + 4 Thu = 19
        assert result == 19

    def test_empty_intervals_falls_back_to_mon_fri(self):
        # Empty list → falls back to Mon–Fri default
        result_with_empty = get_period_working_days("2025-07-01", "2025-07-31", [])
        result_default    = get_period_working_days("2025-07-01", "2025-07-31", None)
        assert result_with_empty == result_default == 23


# ===========================================================================
# 3. Decimal precision helpers
# ===========================================================================

class TestDecimalHelpers:

    def test_round2_half_up(self):
        assert _round2(_d("1.005")) == Decimal("1.01")
        assert _round2(_d("1.004")) == Decimal("1.00")
        assert _round2(_d("2.555")) == Decimal("2.56")

    def test_no_floating_point_drift(self):
        # Classic float drift: 0.1 + 0.2 != 0.3 in float, but Decimal is exact
        result = _round2(_d("0.1") + _d("0.2"))
        assert result == Decimal("0.30")

    def test_large_wage_precision(self):
        wage = _d("125000.00")
        rate = _round2(wage / _d(22))
        # 125000 / 22 = 5681.818181... → rounds to 5681.82
        assert rate == Decimal("5681.82")

    def test_lop_deduction_precision(self):
        wage = _d("8500.00")
        working_days = 23
        daily_rate = _round2(wage / _d(working_days))
        lop = _round2(_d(2) * daily_rate)
        # 8500 / 23 = 369.5652... → 369.57; × 2 = 739.14
        assert daily_rate == Decimal("369.57")
        assert lop == Decimal("739.14")


# ===========================================================================
# 4. LOP daily rate accuracy across different month sizes
# ===========================================================================

class TestLOPDailyRateAccuracy:
    """
    Verify that daily_rate = wage / working_days produces correct values
    for months with 19, 20, 21, 22, and 23 working days.
    """

    WAGE = Decimal("66000.00")

    @pytest.mark.parametrize("period_start,period_end,expected_wd,lop_days,expected_lop", [
        # 19 working days — Feb 2015
        ("2015-02-01", "2015-02-28", 19, 1, _round2(Decimal("66000") / 19)),
        # 20 working days — Feb 2026
        ("2026-02-01", "2026-02-28", 20, 1, _round2(Decimal("66000") / 20)),
        # 21 working days — Mar 2025
        ("2025-03-01", "2025-03-31", 21, 2, _round2(Decimal("66000") / 21 * 2)),
        # 22 working days — Apr 2019
        ("2019-04-01", "2019-04-30", 22, 3, _round2(Decimal("66000") / 22 * 3)),
        # 23 working days — Jul 2025
        ("2025-07-01", "2025-07-31", 23, 2, _round2(Decimal("66000") / 23 * 2)),
    ])
    def test_lop_deduction_by_month(
        self, period_start, period_end, expected_wd, lop_days, expected_lop
    ):
        wd = get_period_working_days(period_start, period_end)
        assert wd == expected_wd, f"Expected {expected_wd} working days, got {wd}"

        daily_rate = _round2(self.WAGE / _d(wd))
        lop_deduction = _round2(_d(lop_days) * daily_rate)
        assert lop_deduction == expected_lop


# ===========================================================================
# 5. compute_payslip — end-to-end with mocked DB
# ===========================================================================

class TestComputePayslip:

    def _build_db(self, wage=8500.0, lop_days=0.0, schedule_intervals=None):
        """Build a minimal mock DB session for compute_payslip."""
        db = MagicMock()

        employee = MagicMock()
        employee.working_schedule_id = None

        contract = _make_contract(wage, employee)
        contract.employee_id = 1

        # Contract query
        contract_q = MagicMock()
        contract_q.filter.return_value.first.return_value = contract

        # SalaryStructure query — return None (use defaults)
        structure_q = MagicMock()
        structure_q.filter.return_value.first.return_value = None

        # LeaveRequest query for LOP
        leave_q = MagicMock()
        if lop_days > 0:
            mock_leave = MagicMock()
            mock_leave.duration_days = lop_days
            leave_q.filter.return_value.all.return_value = [mock_leave]
        else:
            leave_q.filter.return_value.all.return_value = []

        # WorkScheduleInterval query
        interval_q = MagicMock()
        interval_q.filter.return_value.all.return_value = schedule_intervals or []

        def query_side_effect(model):
            from models.contract import Contract
            from models.leave import LeaveRequest
            from models.payroll import SalaryStructure
            from models.working_schedule import WorkScheduleInterval
            if model is Contract:
                return contract_q
            if model is LeaveRequest:
                return leave_q
            if model is SalaryStructure:
                return structure_q
            if model is WorkScheduleInterval:
                return interval_q
            return MagicMock()

        db.query.side_effect = query_side_effect
        return db

    def test_basic_computation_july_2025(self):
        """23 working days, no LOP — verify all rule outputs."""
        db = self._build_db(wage=8500.0)
        slip = _make_payslip()

        result = compute_payslip(db, slip, "2025-07-01", "2025-07-31")

        assert result.basic == 8500.0
        assert result.allowances == round(8500 * 0.15, 2)
        assert result.gross == round(8500 * 1.15, 2)
        assert result.deductions == round(result.gross * 0.10, 2)
        assert result.net == round(result.gross - result.deductions, 2)
        assert result.worked_days == 23.0

    def test_lop_deduction_reduces_net(self):
        """2 LOP days in July 2025 (23 working days) must reduce net correctly."""
        db = self._build_db(wage=8500.0, lop_days=2.0)
        slip = _make_payslip()

        result = compute_payslip(db, slip, "2025-07-01", "2025-07-31")

        breakdown = json.loads(result.breakdown_json)
        assert breakdown["4_Working_Days"] == 23
        assert breakdown["4_LOP_Days"] == 2.0

        expected_daily = float(_round2(_d("8500") / _d(23)))
        expected_lop   = float(_round2(_d(2) * _d(str(expected_daily))))
        assert abs(breakdown["4_LOP_Deduction"] - expected_lop) < 0.01

        # Net must be less than net without LOP
        db_no_lop = self._build_db(wage=8500.0, lop_days=0.0)
        slip_no_lop = _make_payslip()
        result_no_lop = compute_payslip(db_no_lop, slip_no_lop, "2025-07-01", "2025-07-31")
        assert result.net < result_no_lop.net

    def test_worked_days_equals_working_days_minus_lop(self):
        db = self._build_db(wage=6000.0, lop_days=3.0)
        slip = _make_payslip()
        result = compute_payslip(db, slip, "2025-07-01", "2025-07-31")
        assert result.worked_days == 20.0  # 23 - 3

    def test_no_contract_raises_400(self):
        """Missing contract must raise HTTP 400, not silently return zero payslip."""
        from fastapi import HTTPException
        db = MagicMock()
        contract_q = MagicMock()
        contract_q.filter.return_value.first.return_value = None

        from models.contract import Contract
        db.query.side_effect = lambda m: contract_q if m is Contract else MagicMock()

        slip = _make_payslip()
        with pytest.raises(HTTPException) as exc_info:
            compute_payslip(db, slip, "2025-07-01", "2025-07-31")
        assert exc_info.value.status_code == 400

    def test_breakdown_json_keys_present(self):
        """All 10 breakdown keys must be present in the JSON output."""
        db = self._build_db(wage=5000.0, lop_days=1.0)
        slip = _make_payslip()
        result = compute_payslip(db, slip, "2025-07-01", "2025-07-31")
        breakdown = json.loads(result.breakdown_json)
        expected_keys = [
            "1_Basic_Pay", "2_Housing_Allowance", "2_Transport_Allowance",
            "3_Gross", "4_Working_Days", "4_LOP_Days", "4_Daily_Rate",
            "4_LOP_Deduction", "5_Income_Tax", "6_Social_Security", "7_Net_Pay",
        ]
        for key in expected_keys:
            assert key in breakdown, f"Missing breakdown key: {key}"

    @pytest.mark.parametrize("period_start,period_end,expected_wd", [
        ("2015-02-01", "2015-02-28", 19),
        ("2026-02-01", "2026-02-28", 20),
        ("2025-03-01", "2025-03-31", 21),
        ("2019-04-01", "2019-04-30", 22),
        ("2025-07-01", "2025-07-31", 23),
    ])
    def test_working_days_stored_in_breakdown(self, period_start, period_end, expected_wd):
        """Breakdown must record the exact working days used for daily rate calculation."""
        db = self._build_db(wage=50000.0)
        slip = _make_payslip()
        result = compute_payslip(db, slip, period_start, period_end)
        breakdown = json.loads(result.breakdown_json)
        assert breakdown["4_Working_Days"] == expected_wd
