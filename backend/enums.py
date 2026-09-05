from enum import Enum

class UserRole(str, Enum):
    HR_EMPLOYEE = "HR_EMPLOYEE"
    HR_OFFICER = "HR_OFFICER"
    HR_MANAGER = "HR_MANAGER"

class ContractState(str, Enum):
    DRAFT = "draft"
    RUNNING = "running"
    EXPIRED = "expired"

class WorkingSchedule(str, Enum):
    FULL_TIME = "full_time"
    PART_TIME = "part_time"
    CONTRACT = "contract"
    INTERN = "intern"

class AttendanceStatus(str, Enum):
    PRESENT = "present"
    PARTIAL = "partial"
    ABSENT = "absent"

class LeaveType(str, Enum):
    PAID = "paid"
    UNPAID = "unpaid"
    SICK = "sick"
    OTHER = "other"

class LeaveStatus(str, Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    APPROVED = "approved"
    REJECTED = "rejected"
