"""
Seed Script — PeoplePay360 Comprehensive Master Dataset
IDEMPOTENT: Safe to call on every server start. Only seeds if DB is empty.
Populates 200 enterprise employees (all Indian professionals + 3 RBAC anchors),
200 contracts, 400+ leave allocations, 200+ attendance logs, 3 payrun batches,
and 400+ itemized calculated payslips.
"""
from datetime import datetime, date
import random

from database import Base, engine, SessionLocal
from auth import get_password_hash
from models.user import User, UserRole
from models.working_schedule import WorkingSchedule, WorkScheduleInterval
from models.employee import Employee
from models.contract import Contract
from models.attendance import Attendance
from models.leave import TimeOffType, LeaveAllocation, LeaveRequest, LeaveStatus
from models.payroll import SalaryStructure, SalaryRule, Payrun, Payslip, RuleCategory, PayrunStatus
from services.salary_engine import compute_payslip

CURRENT_YEAR = 2025

# 197 Indian-named professionals across 8 departments (plus 3 RBAC anchors = 200 total)
INDIAN_NAMES_DATA = [
    # Engineering (55 people)
    ("Priyanshu", "Sharma", "Engineering", "Lead Full Stack Architect", 125000),
    ("Sneha", "Patel", "Engineering", "Senior Frontend Engineer", 95000),
    ("Rohan", "Gupta", "Engineering", "DevOps & Cloud Specialist", 88000),
    ("Ananya", "Roy", "Engineering", "QA Automation Lead", 68000),
    ("Vikram", "Rao", "Engineering", "Backend Systems Engineer", 82000),
    ("Aditya", "Verma", "Engineering", "Senior Software Engineer", 85000),
    ("Aarav", "Singh", "Engineering", "Data Platform Engineer", 92000),
    ("Ishaan", "Malhotra", "Engineering", "Machine Learning Specialist", 110000),
    ("Kavya", "Nair", "Engineering", "UI/UX Engineer", 75000),
    ("Madhav", "Iyer", "Engineering", "Site Reliability Engineer", 88000),
    ("Siddharth", "Joshi", "Engineering", "Cloud Infrastructure Lead", 115000),
    ("Shreya", "Chatterjee", "Engineering", "Software Engineer - Core", 70000),
    ("Varun", "Deshmukh", "Engineering", "Mobile Applications Developer", 78000),
    ("Gaurav", "Choudhury", "Engineering", "Security & Compliance Engineer", 94000),
    ("Divya", "Bhattacharya", "Engineering", "Backend Developer", 72000),
    ("Harsh", "Saxena", "Engineering", "Systems Architect", 130000),
    ("Nikhil", "Mehta", "Engineering", "Database Administrator", 84000),
    ("Poonam", "Bansal", "Engineering", "Quality Assurance Engineer", 62000),
    ("Ankit", "Tiwari", "Engineering", "Full Stack Developer", 76000),
    ("Kunal", "Pandey", "Engineering", "DevOps Engineer", 80000),
    ("Sachin", "Kulkarni", "Engineering", "Senior Systems Programmer", 98000),
    ("Swati", "Mishra", "Engineering", "Software Test Automation Engineer", 65000),
    ("Tarun", "Agarwal", "Engineering", "API Platform Developer", 74000),
    ("Vishal", "Yadav", "Engineering", "Microservices Engineer", 81000),
    ("Yash", "Jain", "Engineering", "Frontend Specialist", 70000),
    ("Abhinav", "Shinde", "Engineering", "Senior Backend Engineer", 89000),
    ("Akhil", "Pillai", "Engineering", "DevOps Infrastructure Engineer", 83000),
    ("Anurag", "Chauhan", "Engineering", "Cloud Operations Specialist", 79000),
    ("Ashish", "Rathore", "Engineering", "Lead Security Engineer", 120000),
    ("Ayush", "Bose", "Engineering", "Frontend UI Developer", 71000),
    ("Lucky", "Panchal", "Engineering", "Lead Full Stack Developer", 95000),
    ("Niharika", "Yadav", "Engineering", "Senior UI/UX Engineer", 90000),
    ("Tanya", "Verma", "Engineering", "Cloud Platform Engineer", 88000),
    ("Puneet", "Arora", "Engineering", "Principal Software Architect", 145000),
    ("Rahit", "Garg", "Engineering", "Embedded Systems Engineer", 78000),
    ("Sumit", "Bahl", "Engineering", "Big Data Engineer", 87000),
    ("Kshitij", "Mathur", "Engineering", "Blockchain Developer", 96000),
    ("Pratik", "Kulkarni", "Engineering", "AR/VR Developer", 82000),
    ("Mihir", "Shah", "Engineering", "Data Science Lead", 108000),
    ("Neerav", "Bhatt", "Engineering", "Network Security Analyst", 76000),
    ("Pallav", "Doshi", "Engineering", "Platform Reliability Engineer", 93000),
    ("Rajiv", "Shukla", "Engineering", "Kernel & OS Developer", 99000),
    ("Samrat", "Chatterjee", "Engineering", "IoT Solutions Architect", 105000),
    ("Tushar", "Mehra", "Engineering", "AI/ML Research Engineer", 118000),
    ("Umesh", "Nair", "Engineering", "ERP Integration Specialist", 85000),
    ("Vivek", "Sinha", "Engineering", "Cybersecurity Expert", 102000),
    ("Arnav", "Patel", "Engineering", "React Native Developer", 79000),
    ("Bharat", "Rana", "Engineering", "Senior QA Lead", 72000),
    ("Chinmay", "Deshpande", "Engineering", "Infra Automation Engineer", 83000),
    ("Dhruv", "Trivedi", "Engineering", "Solution Architect", 128000),
    ("Eshan", "Kapoor", "Engineering", "Java Backend Developer", 77000),
    ("Farhan", "Ansari", "Engineering", "Python & Django Developer", 74000),
    ("Gagan", "Ahuja", "Engineering", "Node.js Developer", 72000),
    ("Himanshu", "Rawat", "Engineering", "Go Lang Backend Developer", 81000),
    ("Ishan", "Oberoi", "Engineering", "Golang Microservices Lead", 89000),

    # Human Resources (20 people)
    ("Neha", "Kapoor", "Human Resources", "Head of People & Culture", 135000),
    ("Rajesh", "Verma", "Human Resources", "Senior Technical Recruiter", 65000),
    ("Pooja", "Nair", "Human Resources", "Employee Relations Lead", 70000),
    ("Bhavna", "Chauhan", "Human Resources", "People Operations Specialist", 55000),
    ("Manish", "Bhatia", "Human Resources", "Talent Acquisition Manager", 85000),
    ("Jyoti", "Mishra", "Human Resources", "HR Generalist", 52000),
    ("Rekha", "Menon", "Human Resources", "Learning & Development Partner", 72000),
    ("Sonali", "Dutta", "Human Resources", "HR Business Partner", 80000),
    ("Kriti", "Shukla", "Human Resources", "Recruitment Coordinator", 48000),
    ("Monika", "Yadav", "Human Resources", "Benefits & Compensation Analyst", 64000),
    ("Namrata", "Pawar", "Human Resources", "HR Compliance Officer", 68000),
    ("Preeti", "Srivastava", "Human Resources", "Staffing Specialist", 54000),
    ("Savita", "Rao", "Human Resources", "HRIS Systems Manager", 78000),
    ("Tejal", "Mehta", "Human Resources", "Performance Management Lead", 73000),
    ("Usha", "Iyer", "Human Resources", "HR Coordinator", 50000),
    ("Vandita", "Jain", "Human Resources", "Compensation Analyst", 67000),
    ("Waqar", "Hussain", "Human Resources", "Diversity & Inclusion Lead", 75000),
    ("Yamini", "Singh", "Human Resources", "Employee Engagement Manager", 71000),
    ("Zainab", "Khan", "Human Resources", "Global HR Specialist", 80000),
    ("Archana", "Pillai", "Human Resources", "Onboarding Specialist", 52000),

    # Finance & Accounting (22 people)
    ("Amit", "Saxena", "Finance", "Chief Financial Controller", 155000),
    ("Sunita", "Joshi", "Finance", "Senior Corporate Accountant", 82000),
    ("Sanjay", "Mehta", "Finance", "Tax Compliance Specialist", 88000),
    ("Alok", "Prasad", "Finance", "Treasury & Cash Flow Manager", 105000),
    ("Harish", "Bansal", "Finance", "Senior Accounts Payable Lead", 62000),
    ("Pallavi", "Ghosh", "Finance", "Financial Planning & Analysis Lead", 95000),
    ("Rajat", "Mukherjee", "Finance", "Internal Audit Specialist", 78000),
    ("Richa", "Sinha", "Finance", "Billing & Revenue Accountant", 58000),
    ("Santosh", "Dubey", "Finance", "Senior Cost Accountant", 74000),
    ("Vineet", "Kashyap", "Finance", "Corporate Tax Consultant", 86000),
    ("Vipul", "Tripathi", "Finance", "Accounts Receivable Lead", 60000),
    ("Deepak", "Chopra", "Finance", "Payroll Compliance Analyst", 67000),
    ("Kritika", "Mishra", "Finance", "Senior Accounts Executive", 65000),
    ("Lalit", "Gupta", "Finance", "Risk & Compliance Officer", 90000),
    ("Minakshi", "Agarwal", "Finance", "Budget & Forecasting Analyst", 72000),
    ("Naveen", "Joshi", "Finance", "Finance Operations Manager", 98000),
    ("Omkar", "Patil", "Finance", "Assistant Controller", 85000),
    ("Prashant", "Kulkarni", "Finance", "Statutory Compliance Lead", 80000),
    ("Qureshi", "Irfan", "Finance", "Financial Reporting Analyst", 74000),
    ("Ramesh", "Bhat", "Finance", "Group Finance Manager", 115000),
    ("Sheetal", "Kadam", "Finance", "Accounts & Admin Lead", 68000),
    ("Tanuja", "Nene", "Finance", "Junior Financial Analyst", 52000),

    # Product & Design (18 people)
    ("Meera", "Iyer", "Product", "VP of Product Strategy", 165000),
    ("Arjun", "Reddy", "Product", "Lead UI/UX Designer", 98000),
    ("Tanvi", "Shah", "Product", "Senior Product Manager", 115000),
    ("Riya", "Sen", "Product", "User Experience Researcher", 72000),
    ("Siddhant", "Roy", "Product", "Technical Product Manager", 102000),
    ("Tanmay", "Deshpande", "Product", "Product Operations Associate", 58000),
    ("Trisha", "Venkatesh", "Product", "Visual & Brand Designer", 69000),
    ("Garima", "Jain", "Product", "Associate Product Manager", 75000),
    ("Akanksha", "Malik", "Product", "Design Systems Specialist", 84000),
    ("Aniruddh", "Dixit", "Product", "Growth Product Specialist", 92000),
    ("Aryan", "Chopra", "Product", "Associate Product Lead", 75000),
    ("Bhoomika", "Hegde", "Product", "UX Research Lead", 88000),
    ("Chaitanya", "Krishnan", "Product", "Product Analytics Manager", 95000),
    ("Darshana", "Patel", "Product", "Junior Product Designer", 58000),
    ("Eshal", "Syed", "Product", "Senior Product Designer", 82000),
    ("Farida", "Sheikh", "Product", "Interaction Designer", 70000),
    ("Gitanjali", "Roy", "Product", "Product Strategy Analyst", 78000),
    ("Hemang", "Trivedi", "Product", "Head of Design", 140000),

    # Sales & Business Development (20 people)
    ("Rahul", "Khanna", "Sales", "Director of Global Enterprise Sales", 160000),
    ("Karan", "Malhotra", "Sales", "Senior Account Executive", 88000),
    ("Pankaj", "Chauhan", "Sales", "Enterprise Sales Lead", 95000),
    ("Pradeep", "Rawat", "Sales", "Business Development Representative", 50000),
    ("Sandeep", "Kaushik", "Sales", "Strategic Accounts Manager", 110000),
    ("Saurabh", "Bhardwaj", "Sales", "Pre-Sales Technical Consultant", 85000),
    ("Sunil", "Negi", "Sales", "Account Executive - Mid Market", 78000),
    ("Uday", "Bhat", "Sales", "Client Success Director", 130000),
    ("Vikas", "Sethi", "Sales", "Regional Sales Manager", 105000),
    ("Jagdeep", "Mohanty", "Sales", "Enterprise Solutions Director", 140000),
    ("Jitendra", "Pandit", "Sales", "Inside Sales Lead", 58000),
    ("Kapil", "Arya", "Sales", "Channel Partnerships Lead", 90000),
    ("Lahar", "Bakshi", "Sales", "Key Account Manager", 96000),
    ("Mridul", "Saha", "Sales", "Sales Operations Analyst", 65000),
    ("Naman", "Saxena", "Sales", "Business Development Executive", 55000),
    ("Onkar", "Kulkarni", "Sales", "Solutions Consultant", 82000),
    ("Prabal", "Nair", "Sales", "Enterprise Sales Manager", 118000),
    ("Quamar", "Sheikh", "Sales", "Inside Sales Representative", 52000),
    ("Randhir", "Tomar", "Sales", "Regional Account Lead", 88000),
    ("Sachet", "Tyagi", "Sales", "Field Sales Executive", 60000),

    # Marketing & Growth (18 people)
    ("Deepika", "Sen", "Marketing", "Head of Brand & Growth Marketing", 125000),
    ("Aditi", "Rao", "Marketing", "Content Strategy & PR Lead", 72000),
    ("Seema", "Goswami", "Marketing", "Digital Marketing Manager", 85000),
    ("Rohit", "Mathur", "Marketing", "Performance & SEO Lead", 78000),
    ("Rupal", "Thakur", "Marketing", "Social Media & Community Lead", 56000),
    ("Shalini", "Tyagi", "Marketing", "Lifecycle Marketing Specialist", 68000),
    ("Shikha", "Tiwari", "Marketing", "Product Marketing Manager", 92000),
    ("Amrita", "Dhar", "Marketing", "Creative Content Producer", 60000),
    ("Ankita", "Aggarwal", "Marketing", "Event & Field Marketing Specialist", 64000),
    ("Charu", "Bose", "Marketing", "Marketing Analytics Specialist", 76000),
    ("Devika", "Pillai", "Marketing", "Campaign Strategy Lead", 80000),
    ("Ekta", "Sharma", "Marketing", "Email Marketing Specialist", 58000),
    ("Fatima", "Siddiqui", "Marketing", "Growth Hacking Analyst", 68000),
    ("Girish", "Gopal", "Marketing", "Brand Experience Manager", 88000),
    ("Hiral", "Shah", "Marketing", "Marketing Operations Lead", 74000),
    ("Ira", "Kapoor", "Marketing", "Creative Director", 110000),
    ("Juhi", "Sinha", "Marketing", "Content Marketing Manager", 72000),
    ("Kaveri", "Raman", "Marketing", "Demand Generation Lead", 86000),

    # Operations, IT & Legal (24 people)
    ("Suresh", "Kumar", "Operations", "Director of Business Operations", 135000),
    ("Manisha", "Das", "Operations", "Facilities & Workplace Manager", 65000),
    ("Harish", "Patil", "Operations", "IT Infrastructure & Security Lead", 82000),
    ("Sanjay", "Rastogi", "Operations", "Procurement & Vendor Manager", 75000),
    ("Sushant", "Mane", "Operations", "Supply Chain Coordinator", 58000),
    ("Upendra", "Nath", "Operations", "Network Operations Administrator", 64000),
    ("Vaishali", "Gokhale", "Legal", "General Legal Counsel", 145000),
    ("Vandana", "Acharya", "Legal", "Corporate Compliance & Risk Manager", 110000),
    ("Vidya", "Krishnan", "Legal", "Contracts & IP Specialist", 85000),
    ("Mukesh", "Solanki", "Operations", "IT Helpdesk Lead", 52000),
    ("Sameer", "Joshi", "Operations", "Systems Operations Lead", 82000),
    ("Laxmi", "Iyer", "Operations", "Office Manager", 55000),
    ("Mahesh", "Kamat", "Operations", "Business Analyst", 70000),
    ("Narayan", "Hegde", "Operations", "Data Center Manager", 80000),
    ("Oshin", "Verma", "Legal", "Intellectual Property Associate", 75000),
    ("Prabhu", "Swami", "Operations", "Operations Coordinator", 52000),
    ("Rashmi", "Pai", "Operations", "Executive Operations Specialist", 60000),
    ("Satyanarayan", "Murthy", "Operations", "VP of Operations", 155000),
    ("Trilok", "Chand", "Operations", "Facilities Coordinator", 48000),
    ("Ujjwala", "Reddy", "Legal", "Legal Operations Manager", 95000),
    ("Vedika", "Jain", "Operations", "Office Admin Lead", 50000),
    ("Wasim", "Baig", "Operations", "IT Systems Administrator", 68000),
    ("Yashwant", "Kale", "Operations", "Procurement Specialist", 60000),
    ("Zeenat", "Mirza", "Legal", "Corporate Secretary", 72000),

    # Customer Success & Support (20 people)
    ("Aparna", "Das", "Customer Success", "Head of Customer Experience", 130000),
    ("Balram", "Tiwari", "Customer Success", "Senior Customer Success Manager", 88000),
    ("Chanchal", "Singh", "Customer Success", "Enterprise Support Lead", 75000),
    ("Daksha", "Patel", "Customer Success", "Customer Onboarding Specialist", 60000),
    ("Falguni", "Mehta", "Customer Success", "Customer Success Manager", 72000),
    ("Geetha", "Ramesh", "Customer Success", "Support Engineer", 62000),
    ("Hema", "Narayanan", "Customer Success", "Technical Support Lead", 70000),
    ("Jai", "Prakash", "Customer Success", "Customer Success Associate", 50000),
    ("Komal", "Sharma", "Customer Success", "Support Quality Analyst", 58000),
    ("Lata", "Mishra", "Customer Success", "Customer Relations Manager", 80000),
    ("Madhuri", "Patkar", "Customer Success", "Voice of Customer Lead", 78000),
    ("Nitin", "Bhosale", "Customer Success", "Technical Account Manager", 85000),
    ("Payal", "Agarwal", "Customer Success", "Customer Training Specialist", 62000),
    ("Rajani", "Nair", "Customer Success", "Customer Success Director", 115000),
    ("Sapna", "Arora", "Customer Success", "Escalation Manager", 82000),
    ("Tejas", "Joshi", "Customer Success", "Support Engineer Level 2", 65000),
    ("Urvashi", "Pandey", "Customer Success", "Community Manager", 60000),
    ("Varsha", "Rathore", "Customer Success", "Implementation Consultant", 74000),
    ("Yogesh", "Bhatia", "Customer Success", "Customer Success Specialist", 68000),
    ("Zoha", "Iqbal", "Customer Success", "Customer Feedback Analyst", 58000),
]


def is_already_seeded(db) -> bool:
    """Check if the database already has data — skip seeding if so."""
    count = db.query(Employee).count()
    return count >= 10  # If we have at least 10 employees, consider DB seeded


def clear_tables(db):
    """Delete all rows in dependency-safe foreign key order for PostgreSQL."""
    db.query(Payslip).delete()
    db.query(Payrun).delete()
    db.query(Contract).delete()
    db.query(SalaryRule).delete()
    db.query(SalaryStructure).delete()
    db.query(LeaveRequest).delete()
    db.query(LeaveAllocation).delete()
    db.query(TimeOffType).delete()
    db.query(Attendance).delete()
    db.query(User).delete()
    db.query(Employee).delete()
    db.query(WorkScheduleInterval).delete()
    db.query(WorkingSchedule).delete()
    db.commit()


def seed(force: bool = False):
    """
    Idempotent seed function.
    - If `force=True`: clears all tables and re-seeds from scratch.
    - If `force=False` (default / called on startup): only seeds if DB is empty.
    """
    db = SessionLocal()
    try:
        if not force and is_already_seeded(db):
            count = db.query(Employee).count()
            print(f"[SEED] Database already has {count} employees — skipping seed. "
                  f"(Run `python seed.py --force` to re-seed from scratch.)")
            return

        print("Clearing existing database tables...")
        clear_tables(db)

        # -------------------------------------------------------------------
        # 1. WORKING SCHEDULES & INTERVALS (Module A3)
        # -------------------------------------------------------------------
        sched_standard = WorkingSchedule(
            name="Standard 40h Full-Time",
            schedule_type="FULL_TIME",
            stored_weekly_hours=40.0,
        )
        sched_flex = WorkingSchedule(
            name="Flexible 36h Shift",
            schedule_type="FLEXIBLE",
            stored_weekly_hours=36.0,
        )
        sched_part = WorkingSchedule(
            name="Part-Time 20h Morning",
            schedule_type="PART_TIME",
            stored_weekly_hours=20.0,
        )
        db.add_all([sched_standard, sched_flex, sched_part])
        db.flush()

        intervals = [
            WorkScheduleInterval(
                schedule_id=sched_standard.id,
                day_of_week=day,
                start_time="09:00",
                end_time="17:00",
                break_hours=0.0,
            )
            for day in range(5)
        ]
        intervals += [
            WorkScheduleInterval(
                schedule_id=sched_part.id,
                day_of_week=day,
                start_time="09:00",
                end_time="13:00",
                break_hours=0.0,
            )
            for day in range(5)
        ]
        db.add_all(intervals)
        db.flush()
        print(f"  [OK] Working Schedules: {sched_standard.name}, {sched_flex.name}, {sched_part.name}")

        # -------------------------------------------------------------------
        # 2. 200 EMPLOYEES — 3 RBAC anchors + 197 Indian-named professionals
        # -------------------------------------------------------------------
        all_emp_specs = [
            ("Alice", "Johnson", "alice.johnson@peoplepay360.dev", "Engineering", "Senior Software Engineer", "GB29NWBK60161331926819", 85000.0),
            ("Bob", "Martinez", "bob.martinez@peoplepay360.dev", "Human Resources", "HR Specialist", "GB82WEST12345698765432", 58000.0),
            ("Carol", "White", "carol.white@peoplepay360.dev", "Finance", "Payroll Analyst", "", 64000.0),
        ]

        bank_codes = ["HDFC000", "SBIN000", "ICIC000", "UTIB000", "KKBK000", "PUNB000", "BARB000", "CNRB000"]
        for idx, (fn, ln, dept, pos, wage) in enumerate(INDIAN_NAMES_DATA, start=4):
            email = f"{fn.lower()}.{ln.lower()}{idx}@peoplepay360.dev"
            bank_code = bank_codes[idx % len(bank_codes)]
            account_num = f"{1000000000 + idx * 83921}"
            iban = f"IN{idx % 90 + 10}{bank_code}{account_num[:6]}"
            all_emp_specs.append((fn, ln, email, dept, pos, iban, float(wage)))

        employee_records = []
        schedules = [sched_standard, sched_flex, sched_part]
        for i, (fn, ln, email, dept, pos, iban, wage) in enumerate(all_emp_specs):
            emp = Employee(
                first_name=fn,
                last_name=ln,
                email=email,
                department=dept,
                job_position=pos,
                working_schedule_id=schedules[i % 3].id,
                bank_account=iban,
                is_active=True,
            )
            db.add(emp)
            employee_records.append((emp, wage))

        db.flush()
        print(f"  [OK] Seeded {len(employee_records)} Enterprise Employees.")

        # Set hierarchy
        alice_emp = employee_records[0][0]
        bob_emp   = employee_records[1][0]
        carol_emp = employee_records[2][0]
        alice_emp.manager_id = bob_emp.id
        db.flush()

        # -------------------------------------------------------------------
        # 3. USERS (5-TIER RBAC)
        # -------------------------------------------------------------------
        default_pwd = get_password_hash("password123")
        users = [
            User(email="admin@peoplepay360.dev",          hashed_password=default_pwd, role=UserRole.ADMIN,               employee_id=None),
            User(email="hr.manager@peoplepay360.dev",     hashed_password=default_pwd, role=UserRole.HR_MANAGER,          employee_id=bob_emp.id),
            User(email="payroll.user@peoplepay360.dev",   hashed_password=default_pwd, role=UserRole.HR_PAYROLL_USER,     employee_id=carol_emp.id),
            User(email="payroll.manager@peoplepay360.dev",hashed_password=default_pwd, role=UserRole.HR_PAYROLL_MANAGER,  employee_id=None),
            User(email="alice.johnson@peoplepay360.dev",  hashed_password=default_pwd, role=UserRole.EMPLOYEE,            employee_id=alice_emp.id),
        ]
        db.add_all(users)
        db.flush()
        print("  [OK] Seeded 5-Tier RBAC user accounts.")

        # -------------------------------------------------------------------
        # 4. SALARY STRUCTURE & SEQUENTIAL RULES (Modules A5 & A6)
        # -------------------------------------------------------------------
        sal_struct = SalaryStructure(name="Regular Monthly", is_active=True)
        db.add(sal_struct)
        db.flush()

        rules = [
            SalaryRule(structure_id=sal_struct.id, name="Basic Pay",                    code="BASIC",         category=RuleCategory.BASIC,      sequence=1, amount_type="FIXED",      amount_value=0.0),
            SalaryRule(structure_id=sal_struct.id, name="House Rent & Transport Allow", code="ALLOWANCE",     category=RuleCategory.ALLOWANCE,  sequence=2, amount_type="PERCENTAGE", amount_value=15.0),
            SalaryRule(structure_id=sal_struct.id, name="Gross Pay",                    code="GROSS",         category=RuleCategory.GROSS,      sequence=3, amount_type="CODE",       amount_value=0.0),
            SalaryRule(structure_id=sal_struct.id, name="Loss of Pay (LOP)",            code="LOP_DEDUCTION", category=RuleCategory.DEDUCTION,  sequence=4, amount_type="CODE",       amount_value=0.0),
            SalaryRule(structure_id=sal_struct.id, name="Provident Fund / Tax",         code="INCOME_TAX",    category=RuleCategory.DEDUCTION,  sequence=5, amount_type="PERCENTAGE", amount_value=7.0),
            SalaryRule(structure_id=sal_struct.id, name="Social Security & Health",     code="SOCIAL_SEC",    category=RuleCategory.DEDUCTION,  sequence=6, amount_type="PERCENTAGE", amount_value=3.0),
            SalaryRule(structure_id=sal_struct.id, name="Net Pay",                      code="NET",           category=RuleCategory.NET,        sequence=7, amount_type="CODE",       amount_value=0.0),
        ]
        db.add_all(rules)
        db.flush()
        print(f"  [OK] Seeded 7 Salary Rules under '{sal_struct.name}'.")

        # -------------------------------------------------------------------
        # 5. 200 EMPLOYMENT CONTRACTS (Module A2)
        # -------------------------------------------------------------------
        contract_records = []
        for emp, wage in employee_records:
            contract = Contract(
                employee_id=emp.id,
                wage=wage,
                date_start="2024-01-01",
                date_end=None,
                department=emp.department,
                job_position=emp.job_position,
                salary_structure_id=sal_struct.id,
                is_active=True,
            )
            db.add(contract)
            contract_records.append(contract)

        db.flush()
        print(f"  [OK] Seeded {len(contract_records)} Employment Contracts.")

        # -------------------------------------------------------------------
        # 6. TIME OFF TYPES & 400+ LEAVE ALLOCATIONS (Module A4)
        # -------------------------------------------------------------------
        paid_leave   = TimeOffType(name="Paid Leave",   unit="days", requires_allocation=True, is_unpaid=False)
        sick_leave   = TimeOffType(name="Sick Leave",   unit="days", requires_allocation=True, is_unpaid=False)
        unpaid_leave = TimeOffType(name="Unpaid Leave", unit="days", requires_allocation=True, is_unpaid=True)
        db.add_all([paid_leave, sick_leave, unpaid_leave])
        db.flush()

        allocations = []
        for emp, _ in employee_records:
            allocations.append(LeaveAllocation(
                employee_id=emp.id,
                type_id=paid_leave.id,
                allocated_days=20.0,
                used_days=float(random.choice([0, 1, 2, 3, 4])),
                year=CURRENT_YEAR,
            ))
            allocations.append(LeaveAllocation(
                employee_id=emp.id,
                type_id=sick_leave.id,
                allocated_days=10.0,
                used_days=float(random.choice([0, 1, 2])),
                year=CURRENT_YEAR,
            ))

        # Alice's unpaid leave for test_04
        allocations.append(LeaveAllocation(
            employee_id=alice_emp.id,
            type_id=unpaid_leave.id,
            allocated_days=10.0,
            used_days=2.0,
            year=CURRENT_YEAR,
        ))

        db.add_all(allocations)
        db.flush()
        print(f"  [OK] Seeded {len(allocations)} Leave Allocations.")

        # -------------------------------------------------------------------
        # 7. LEAVE REQUESTS (50+ Requests in Queue)
        # -------------------------------------------------------------------
        leave_req_objs = [
            LeaveRequest(employee_id=alice_emp.id, type_id=unpaid_leave.id, date_from="2025-07-10", date_to="2025-07-11", duration_days=2.0, status=LeaveStatus.APPROVED, is_unpaid=True),
            LeaveRequest(employee_id=bob_emp.id,   type_id=paid_leave.id,   date_from="2025-07-14", date_to="2025-07-14", duration_days=1.0, status=LeaveStatus.PENDING,  is_unpaid=False),
        ]

        statuses = [LeaveStatus.APPROVED, LeaveStatus.PENDING, LeaveStatus.REFUSED]
        for i in range(2, min(52, len(employee_records))):
            emp = employee_records[i][0]
            day_start = 5 + (i % 20)
            leave_req_objs.append(LeaveRequest(
                employee_id=emp.id,
                type_id=paid_leave.id if i % 4 != 0 else sick_leave.id,
                date_from=f"2025-07-{day_start:02d}",
                date_to=f"2025-07-{min(day_start + (i % 3), 31):02d}",
                duration_days=float((i % 3) + 1),
                status=statuses[i % len(statuses)],
                is_unpaid=False,
            ))

        db.add_all(leave_req_objs)
        db.flush()
        print(f"  [OK] Seeded {len(leave_req_objs)} Leave Requests.")

        # -------------------------------------------------------------------
        # 8. ATTENDANCE LOGS (200+ Check-in/out Records)
        # -------------------------------------------------------------------
        attendances = [
            Attendance(employee_id=alice_emp.id, check_in=datetime(2025, 7, 1, 9, 0, 0),  check_out=datetime(2025, 7, 1, 17, 0, 0),  worked_hours=8.0, status="PRESENT", is_manual_override=False),
            Attendance(employee_id=bob_emp.id,   check_in=datetime(2025, 7, 1, 8, 45, 0), check_out=datetime(2025, 7, 1, 16, 45, 0), worked_hours=8.0, status="PRESENT", is_manual_override=True),
        ]

        # Generate 2 attendance records per employee for first 100 employees
        for i in range(1, min(len(employee_records), 100)):
            emp = employee_records[i][0]
            is_late = (i % 6 == 0)
            in_hour = 10 if is_late else 9
            in_min  = 15 if is_late else random.choice([0, 5, 10])
            attendances.append(Attendance(
                employee_id=emp.id,
                check_in=datetime(2025, 7, 1, in_hour, in_min, 0),
                check_out=datetime(2025, 7, 1, 17, 30, 0),
                worked_hours=8.5 if not is_late else 7.25,
                status="LATE" if is_late else "PRESENT",
                is_manual_override=(i % 11 == 0),
            ))
            attendances.append(Attendance(
                employee_id=emp.id,
                check_in=datetime(2025, 7, 2, 8, 55, 0),
                check_out=datetime(2025, 7, 2, 17, 15, 0),
                worked_hours=8.3,
                status="PRESENT",
                is_manual_override=False,
            ))

        db.add_all(attendances)
        db.flush()
        print(f"  [OK] Seeded {len(attendances)} Attendance Records.")

        # -------------------------------------------------------------------
        # 9. PAYRUNS & ITEMIZED PAYSLIPS (3 Batches, 400+ Payslips)
        # -------------------------------------------------------------------
        payrun_july = Payrun(name="July 2025 Monthly Payrun", structure_id=sal_struct.id, period_start="2025-07-01", period_end="2025-07-31", status=PayrunStatus.DRAFT)
        payrun_june = Payrun(name="June 2025 Monthly Payrun", structure_id=sal_struct.id, period_start="2025-06-01", period_end="2025-06-30", status=PayrunStatus.PAID)
        payrun_may  = Payrun(name="May 2025 Monthly Payrun",  structure_id=sal_struct.id, period_start="2025-05-01", period_end="2025-05-31", status=PayrunStatus.PAID)
        db.add_all([payrun_july, payrun_june, payrun_may])
        db.flush()

        # June payslips for all 200 employees (PAID)
        june_slips = []
        for contract in contract_records:
            slip = Payslip(payrun_id=payrun_june.id, employee_id=contract.employee_id, contract_id=contract.id)
            slip = compute_payslip(db, slip, payrun_june.period_start, payrun_june.period_end)
            db.add(slip)
            june_slips.append(slip)

        # May payslips for all 200 employees (PAID)
        may_slips = []
        for contract in contract_records:
            slip = Payslip(payrun_id=payrun_may.id, employee_id=contract.employee_id, contract_id=contract.id)
            slip = compute_payslip(db, slip, payrun_may.period_start, payrun_may.period_end)
            db.add(slip)
            may_slips.append(slip)

        # July payslips for all 200 employees (COMPUTED - current active)
        july_slips = []
        for contract in contract_records:
            slip = Payslip(payrun_id=payrun_july.id, employee_id=contract.employee_id, contract_id=contract.id)
            slip = compute_payslip(db, slip, payrun_july.period_start, payrun_july.period_end)
            db.add(slip)
            july_slips.append(slip)

        payrun_july.status = PayrunStatus.COMPUTED
        db.commit()

        total_entries = (
            len(employee_records) + len(contract_records) + len(allocations)
            + len(leave_req_objs) + len(attendances)
            + len(june_slips) + len(may_slips) + len(july_slips)
            + 3 + len(users) + len(rules) + 3
        )
        print(f"\n=======================================================")
        print(f"[SUCCESS] {total_entries}+ records seeded into database!")
        print(f"  Employees        : {len(employee_records)}")
        print(f"  Contracts        : {len(contract_records)}")
        print(f"  Leave Allocations: {len(allocations)}")
        print(f"  Leave Requests   : {len(leave_req_objs)}")
        print(f"  Attendance Logs  : {len(attendances)}")
        print(f"  Payruns          : 3 batches (May, June, July 2025)")
        print(f"  Payslips         : {len(june_slips) + len(may_slips) + len(july_slips)} across 3 batches")
        print(f"  RBAC Accounts    : 5 personas (password: password123)")
        print(f"=======================================================\n")

    except Exception as exc:
        db.rollback()
        print(f"\n[ERROR] Seed failed: {exc}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    import sys
    force = "--force" in sys.argv
    Base.metadata.create_all(bind=engine)
    seed(force=force)
