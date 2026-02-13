# Punch In/Out Time Tracking Module

## 🎯 Overview
This module handles employee attendance tracking with punch-in/punch-out functionality, overtime calculation, shift management, and comprehensive reporting.

## 🗄️ Database Schema

### Tables Structure

#### 1. **employees** (Master Table)
```sql
CREATE TABLE employees (
    employee_id VARCHAR(50) PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    department VARCHAR(100),
    designation VARCHAR(100),
    shift_id INT,
    manager_id VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (shift_id) REFERENCES shifts(shift_id),
    FOREIGN KEY (manager_id) REFERENCES employees(employee_id)
);
```

#### 2. **shifts** (Shift Configuration)
```sql
CREATE TABLE shifts (
    shift_id INT PRIMARY KEY AUTO_INCREMENT,
    shift_name VARCHAR(50) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    grace_period_minutes INT DEFAULT 15,
    half_day_hours DECIMAL(4,2) DEFAULT 4.00,
    full_day_hours DECIMAL(4,2) DEFAULT 8.00,
    overtime_threshold_minutes INT DEFAULT 30,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 3. **attendance** (Daily Punch Records)
```sql
CREATE TABLE attendance (
    attendance_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    employee_id VARCHAR(50) NOT NULL,
    attendance_date DATE NOT NULL,
    punch_in_time TIMESTAMP,
    punch_in_location VARCHAR(255),
    punch_in_ip VARCHAR(45),
    punch_in_device VARCHAR(100),
    punch_out_time TIMESTAMP,
    punch_out_location VARCHAR(255),
    punch_out_ip VARCHAR(45),
    punch_out_device VARCHAR(100),
    total_hours DECIMAL(5,2),
    overtime_hours DECIMAL(5,2) DEFAULT 0,
    break_hours DECIMAL(5,2) DEFAULT 0,
    status ENUM('PRESENT', 'ABSENT', 'HALF_DAY', 'LATE', 'ON_LEAVE', 'HOLIDAY', 'WEEK_OFF') DEFAULT 'PRESENT',
    is_overtime_approved BOOLEAN DEFAULT FALSE,
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(employee_id),
    UNIQUE KEY unique_attendance (employee_id, attendance_date),
    INDEX idx_emp_date (employee_id, attendance_date),
    INDEX idx_date (attendance_date)
);
```

#### 4. **breaks** (Break Time Tracking)
```sql
CREATE TABLE breaks (
    break_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    attendance_id BIGINT NOT NULL,
    break_start_time TIMESTAMP NOT NULL,
    break_end_time TIMESTAMP,
    break_type ENUM('LUNCH', 'TEA', 'PERSONAL', 'OTHER') DEFAULT 'LUNCH',
    duration_minutes INT,
    remarks VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (attendance_id) REFERENCES attendance(attendance_id) ON DELETE CASCADE,
    INDEX idx_attendance (attendance_id)
);
```

#### 5. **attendance_corrections** (Edit Requests)
```sql
CREATE TABLE attendance_corrections (
    correction_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    attendance_id BIGINT NOT NULL,
    employee_id VARCHAR(50) NOT NULL,
    correction_type ENUM('PUNCH_IN', 'PUNCH_OUT', 'BREAK', 'FULL_DAY') NOT NULL,
    original_punch_in TIMESTAMP,
    original_punch_out TIMESTAMP,
    requested_punch_in TIMESTAMP,
    requested_punch_out TIMESTAMP,
    reason TEXT NOT NULL,
    status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
    approved_by VARCHAR(50),
    approved_at TIMESTAMP,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (attendance_id) REFERENCES attendance(attendance_id),
    FOREIGN KEY (employee_id) REFERENCES employees(employee_id),
    FOREIGN KEY (approved_by) REFERENCES employees(employee_id),
    INDEX idx_employee (employee_id),
    INDEX idx_status (status)
);
```

#### 6. **holidays** (Holiday Calendar)
```sql
CREATE TABLE holidays (
    holiday_id INT PRIMARY KEY AUTO_INCREMENT,
    holiday_date DATE NOT NULL UNIQUE,
    holiday_name VARCHAR(255) NOT NULL,
    holiday_type ENUM('NATIONAL', 'FESTIVAL', 'OPTIONAL', 'COMPANY') DEFAULT 'NATIONAL',
    is_mandatory BOOLEAN DEFAULT TRUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 7. **weekly_offs** (Week Off Configuration)
```sql
CREATE TABLE weekly_offs (
    weekly_off_id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id VARCHAR(50),
    shift_id INT,
    day_of_week ENUM('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY') NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    effective_from DATE NOT NULL,
    effective_to DATE,
    FOREIGN KEY (employee_id) REFERENCES employees(employee_id),
    FOREIGN KEY (shift_id) REFERENCES shifts(shift_id),
    INDEX idx_employee (employee_id),
    INDEX idx_shift (shift_id)
);
```

#### 8. **monthly_attendance_summary** (Monthly Reports)
```sql
CREATE TABLE monthly_attendance_summary (
    summary_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    employee_id VARCHAR(50) NOT NULL,
    year INT NOT NULL,
    month INT NOT NULL,
    total_working_days INT DEFAULT 0,
    present_days INT DEFAULT 0,
    absent_days INT DEFAULT 0,
    half_days INT DEFAULT 0,
    late_days INT DEFAULT 0,
    leaves_taken INT DEFAULT 0,
    total_hours_worked DECIMAL(8,2) DEFAULT 0,
    total_overtime_hours DECIMAL(8,2) DEFAULT 0,
    average_punch_in_time TIME,
    average_punch_out_time TIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(employee_id),
    UNIQUE KEY unique_month_summary (employee_id, year, month),
    INDEX idx_year_month (year, month)
);
```

#### 9. **overtime_requests** (Overtime Approval)
```sql
CREATE TABLE overtime_requests (
    overtime_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    attendance_id BIGINT NOT NULL,
    employee_id VARCHAR(50) NOT NULL,
    overtime_date DATE NOT NULL,
    requested_hours DECIMAL(5,2) NOT NULL,
    reason TEXT NOT NULL,
    status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
    approved_by VARCHAR(50),
    approved_at TIMESTAMP,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (attendance_id) REFERENCES attendance(attendance_id),
    FOREIGN KEY (employee_id) REFERENCES employees(employee_id),
    FOREIGN KEY (approved_by) REFERENCES employees(employee_id),
    INDEX idx_employee (employee_id),
    INDEX idx_status (status)
);
```

#### 10. **audit_logs** (Activity Tracking)
```sql
CREATE TABLE audit_logs (
    log_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    employee_id VARCHAR(50),
    action_type VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100),
    old_value TEXT,
    new_value TEXT,
    ip_address VARCHAR(45),
    user_agent VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(employee_id),
    INDEX idx_employee (employee_id),
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_created (created_at)
);
```

---

## 🔄 Flow Diagrams

### 1. Punch In Flow
```mermaid
flowchart TD
    A[Employee Clicks Punch In] --> B{Already Punched In Today?}
    B -->|Yes| C[Show Error: Already Punched In]
    B -->|No| D{Is Today a Holiday?}
    D -->|Yes| E[Show Warning: Holiday - Confirm?]
    E -->|Cancel| F[Cancel Punch In]
    E -->|Confirm| G[Check Shift Schedule]
    D -->|No| G
    G --> H{Is it Week Off?}
    H -->|Yes| I[Show Warning: Week Off - Confirm?]
    I -->|Cancel| F
    I -->|Confirm| J[Capture Location & IP]
    H -->|No| J
    J --> K[Record Punch In Time]
    K --> L{Is Late?}
    L -->|Yes| M[Mark as LATE Status]
    L -->|No| N[Mark as PRESENT Status]
    M --> O[Save to Database]
    N --> O
    O --> P[Send Notification]
    P --> Q[Update UI - Show Punch Out Button]
```

### 2. Punch Out Flow
```mermaid
flowchart TD
    A[Employee Clicks Punch Out] --> B{Punched In Today?}
    B -->|No| C[Show Error: No Punch In Record]
    B -->|Yes| D{Already Punched Out?}
    D -->|Yes| E[Show Error: Already Punched Out]
    D -->|No| F[Capture Location & IP]
    F --> G[Record Punch Out Time]
    G --> H[Calculate Total Hours]
    H --> I[Calculate Break Time]
    I --> J[Calculate Net Working Hours]
    J --> K{Hours >= Full Day?}
    K -->|Yes| L[Mark as PRESENT]
    K -->|No| M{Hours >= Half Day?}
    M -->|Yes| N[Mark as HALF_DAY]
    M -->|No| O[Mark as ABSENT]
    L --> P[Check Overtime]
    N --> P
    O --> P
    P --> Q{Overtime Hours > 0?}
    Q -->|Yes| R[Create Overtime Request]
    Q -->|No| S[Save to Database]
    R --> S
    S --> T[Update Monthly Summary]
    T --> U[Send Notification]
    U --> V[Show Summary to Employee]
```

### 3. Break Management Flow
```mermaid
flowchart TD
    A[Employee Action] --> B{Start or End Break?}
    B -->|Start Break| C{Currently Punched In?}
    C -->|No| D[Error: Must Punch In First]
    C -->|Yes| E{Already on Break?}
    E -->|Yes| F[Error: Already on Break]
    E -->|No| G[Record Break Start Time]
    G --> H[Select Break Type]
    H --> I[Save Break Record]
    I --> J[Update UI - Show End Break Button]
    
    B -->|End Break| K{Break Started?}
    K -->|No| L[Error: No Active Break]
    K -->|Yes| M[Record Break End Time]
    M --> N[Calculate Break Duration]
    N --> O{Break > Max Allowed?}
    O -->|Yes| P[Show Warning: Exceeds Limit]
    O -->|No| Q[Save Break Record]
    P --> Q
    Q --> R[Update Total Break Hours]
    R --> S[Update UI - Show Start Break Button]
```

### 4. Attendance Correction Flow
```mermaid
flowchart TD
    A[Employee Requests Correction] --> B[Select Date]
    B --> C{Has Attendance Record?}
    C -->|No| D[Error: No Record Found]
    C -->|Yes| E[Show Current Times]
    E --> F[Select Correction Type]
    F --> G{Type?}
    G -->|Punch In| H[Enter Correct Punch In Time]
    G -->|Punch Out| I[Enter Correct Punch Out Time]
    G -->|Full Day| J[Enter Both Times]
    H --> K[Enter Reason]
    I --> K
    J --> K
    K --> L[Attach Proof if needed]
    L --> M[Submit Correction Request]
    M --> N[Save to DB - Status: PENDING]
    N --> O[Notify Manager]
    O --> P{Manager Action?}
    P -->|Approve| Q[Update Attendance Record]
    P -->|Reject| R[Send Rejection Notification]
    Q --> S[Recalculate Hours]
    S --> T[Update Monthly Summary]
    T --> U[Notify Employee - Approved]
    R --> V[Notify Employee - Rejected]
```

### 5. Manager Approval Flow
```mermaid
flowchart TD
    A[Manager Dashboard] --> B[View Pending Requests]
    B --> C{Request Type?}
    C -->|Correction| D[View Correction Details]
    C -->|Overtime| E[View Overtime Details]
    D --> F[Review Original & Requested Times]
    E --> G[Review Overtime Hours]
    F --> H{Valid Reason?}
    G --> H
    H -->|Yes| I[Approve Request]
    H -->|No| J[Enter Rejection Reason]
    I --> K[Update Request Status]
    J --> L[Reject Request]
    L --> K
    K --> M{Request Type?}
    M -->|Correction| N[Update Attendance]
    M -->|Overtime| O[Mark Overtime as Approved]
    N --> P[Recalculate Summary]
    O --> P
    P --> Q[Send Notification to Employee]
```

### 6. Monthly Report Generation Flow
```mermaid
flowchart TD
    A[Month End or Manual Trigger] --> B[Get Employee List]
    B --> C[For Each Employee]
    C --> D[Get Attendance Records]
    D --> E[Calculate Total Working Days]
    E --> F[Count Present Days]
    F --> G[Count Absent Days]
    G --> H[Count Half Days]
    H --> I[Count Late Days]
    I --> J[Sum Total Hours]
    J --> K[Sum Overtime Hours]
    K --> L[Calculate Average Punch In Time]
    L --> M[Calculate Average Punch Out Time]
    M --> N[Check for Anomalies]
    N --> O{Issues Found?}
    O -->|Yes| P[Flag for Review]
    O -->|No| Q[Save Summary]
    P --> Q
    Q --> R{More Employees?}
    R -->|Yes| C
    R -->|No| S[Generate Department Reports]
    S --> T[Send to HR & Managers]
```

### 7. Complete System Architecture
```mermaid
flowchart TB
    subgraph Frontend
        A[Web Interface]
        B[Employee Portal]
        C[Manager Dashboard]
        D[HR Dashboard]
    end
    
    subgraph API_Gateway
        E[API Gateway]
        F[Authentication]
        G[Rate Limiting]
    end
    
    subgraph Lambda_Functions
        H[Punch In Handler]
        I[Punch Out Handler]
        J[Break Handler]
        K[Correction Handler]
        L[Report Handler]
        M[Approval Handler]
    end
    
    subgraph Database
        N[(MySQL/PostgreSQL)]
        O[(Redis Cache)]
    end
    
    subgraph External_Services
        P[SNS - Notifications]
        Q[SQS - Queue]
        R[S3 - Reports]
        S[CloudWatch - Logs]
    end
    
    A --> E
    B --> E
    C --> E
    D --> E
    E --> F
    F --> G
    G --> H
    G --> I
    G --> J
    G --> K
    G --> L
    G --> M
    H --> N
    H --> O
    I --> N
    I --> O
    J --> N
    K --> N
    L --> N
    M --> N
    H --> P
    I --> P
    M --> P
    L --> Q
    L --> R
    H --> S
    I --> S
```

---

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/profile
```

### Punch Operations
```
POST   /api/attendance/punch-in
POST   /api/attendance/punch-out
GET    /api/attendance/status
GET    /api/attendance/today
```

### Break Management
```
POST   /api/attendance/break/start
POST   /api/attendance/break/end
GET    /api/attendance/breaks/{attendanceId}
```

### Attendance Records
```
GET    /api/attendance/employee/{employeeId}
GET    /api/attendance/employee/{employeeId}/month/{year}/{month}
GET    /api/attendance/date/{date}
GET    /api/attendance/{attendanceId}
```

### Corrections
```
POST   /api/corrections/request
GET    /api/corrections/employee/{employeeId}
GET    /api/corrections/pending
PUT    /api/corrections/{correctionId}/approve
PUT    /api/corrections/{correctionId}/reject
```

### Overtime
```
POST   /api/overtime/request
GET    /api/overtime/employee/{employeeId}
GET    /api/overtime/pending
PUT    /api/overtime/{overtimeId}/approve
PUT    /api/overtime/{overtimeId}/reject
```

### Reports
```
GET    /api/reports/employee/{employeeId}/summary/{year}/{month}
GET    /api/reports/department/{department}/summary/{year}/{month}
GET    /api/reports/late-comers/{date}
GET    /api/reports/absentees/{date}
POST   /api/reports/generate
```

### Master Data
```
GET    /api/shifts
GET    /api/holidays
GET    /api/weekly-offs
POST   /api/shifts
POST   /api/holidays
```

---

## 📂 Project Structure

```
backend/punch_in_out/
├── src/
│   ├── main/
│   │   ├── java/com/hrportal/attendance/
│   │   │   ├── AttendanceApplication.java
│   │   │   ├── config/
│   │   │   │   ├── DatabaseConfig.java
│   │   │   │   ├── SecurityConfig.java
│   │   │   │   └── SchedulerConfig.java
│   │   │   ├── controller/
│   │   │   │   ├── AttendanceController.java
│   │   │   │   ├── BreakController.java
│   │   │   │   ├── CorrectionController.java
│   │   │   │   ├── OvertimeController.java
│   │   │   │   └── ReportController.java
│   │   │   ├── service/
│   │   │   │   ├── AttendanceService.java
│   │   │   │   ├── BreakService.java
│   │   │   │   ├── CorrectionService.java
│   │   │   │   ├── OvertimeService.java
│   │   │   │   ├── ReportService.java
│   │   │   │   ├── NotificationService.java
│   │   │   │   └── ValidationService.java
│   │   │   ├── repository/
│   │   │   │   ├── AttendanceRepository.java
│   │   │   │   ├── BreakRepository.java
│   │   │   │   ├── CorrectionRepository.java
│   │   │   │   ├── OvertimeRepository.java
│   │   │   │   ├── EmployeeRepository.java
│   │   │   │   ├── ShiftRepository.java
│   │   │   │   └── HolidayRepository.java
│   │   │   ├── model/
│   │   │   │   ├── Attendance.java
│   │   │   │   ├── Break.java
│   │   │   │   ├── AttendanceCorrection.java
│   │   │   │   ├── OvertimeRequest.java
│   │   ���   │   ├── Employee.java
│   │   │   │   ├── Shift.java
│   │   │   │   └── Holiday.java
│   │   │   ├── dto/
│   │   │   │   ├── PunchInRequest.java
│   │   │   │   ├── PunchOutRequest.java
│   │   │   │   ├── AttendanceResponse.java
│   │   │   │   ├── CorrectionRequest.java
│   │   │   │   ├── OvertimeRequestDTO.java
│   │   │   │   └── MonthlyReportDTO.java
��   │   │   ├── exception/
│   │   │   │   ├── GlobalExceptionHandler.java
│   │   │   │   ├── AttendanceException.java
│   │   │   │   └── ValidationException.java
│   │   │   ├── util/
│   │   │   │   ├── DateTimeUtil.java
│   │   │   │   ├── CalculationUtil.java
│   │   │   │   └── ValidationUtil.java
│   │   │   ├── scheduler/
│   │   │   │   ├── MonthlyReportScheduler.java
│   │   │   │   └── AutoPunchOutScheduler.java
│   │   │   └── handler/
│   │   │       └── AttendanceLambdaHandler.java
│   │   └── resources/
│   │       ├── application.yml
│   │       ├── application-dev.yml
│   │       ├── application-prod.yml
│   │       └── db/
│   │           ├── schema.sql
│   │           └── data.sql
│   └── test/
├── pom.xml
├── template.yaml
├── README.md
└── .env.example
```

---

## 🚀 Getting Started

### Prerequisites
```bash
- Java 17 or higher
- Maven 3.8+
- MySQL 8.0+ or PostgreSQL 14+
- AWS CLI (for deployment)
```

### Local Setup

1. **Clone the repository**
```bash
cd backend/punch_in_out
```

2. **Configure Database**
```bash
# Create database
mysql -u root -p
CREATE DATABASE hr_attendance;

# Run schema
mysql -u root -p hr_attendance < src/main/resources/db/schema.sql
```

3. **Configure Application**
```bash
cp .env.example .env
# Edit .env with your database credentials
```

4. **Build and Run**
```bash
mvn clean install
mvn spring-boot:run
```

5. **Test Endpoints**
```bash
# Punch In
curl -X POST http://localhost:8082/api/attendance/punch-in \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": "EMP001",
    "location": "Office Lobby",
    "deviceInfo": "Chrome/Windows"
  }'

# Check Status
curl http://localhost:8082/api/attendance/status?employeeId=EMP001
```

---

## 📊 Business Rules

### Attendance Calculation
1. **Full Day**: >= 8 hours (configurable per shift)
2. **Half Day**: >= 4 hours and < 8 hours
3. **Absent**: < 4 hours
4. **Late**: Punch in after grace period (default 15 mins)
5. **Overtime**: Hours worked beyond shift end time + threshold (30 mins)

### Break Rules
1. **Maximum Break Time**: 1 hour per day (configurable)
2. **Break Types**: Lunch (30 mins), Tea (15 mins), Personal
3. **Break deducted from total working hours**

### Correction Rules
1. **Correction Window**: Up to 7 days from attendance date
2. **Requires manager approval**
3. **Reason mandatory for all corrections**
4. **Proof attachment recommended**

### Overtime Rules
1. **Minimum overtime**: 30 minutes (configurable)
2. **Requires manager approval**
3. **Auto-calculated after punch out**
4. **Can be approved/rejected by manager**

---

## 🔐 Security Considerations

1. **Authentication**: JWT token-based
2. **Authorization**: Role-based (Employee, Manager, HR, Admin)
3. **IP Whitelisting**: Optional for punch operations
4. **Geofencing**: Optional location verification
5. **Rate Limiting**: Prevent abuse
6. **Audit Logging**: All operations logged

---

## 📈 Performance Optimizations

1. **Caching**: Redis for current day attendance status
2. **Indexing**: Proper database indexes on frequently queried columns
3. **Batch Processing**: Monthly reports generated in batches
4. **Async Operations**: Notifications sent asynchronously
5. **Connection Pooling**: Database connection pooling

---

## 🧪 Testing

```bash
# Run unit tests
mvn test

# Run integration tests
mvn verify

# Run with coverage
mvn clean test jacoco:report
```

---

## 🚀 Deployment

### AWS Lambda Deployment

```bash
# Build
mvn clean package

# Deploy
sam build
sam deploy --guided
```

### Environment Variables
```
DB_HOST=your-rds-endpoint
DB_PORT=3306
DB_NAME=hr_attendance
DB_USERNAME=admin
DB_PASSWORD=your-password
JWT_SECRET=your-jwt-secret
REDIS_HOST=your-redis-endpoint
SNS_TOPIC_ARN=your-sns-topic
```

---

## 📞 Support

For issues and questions, contact: [your-email@company.com]

---

## 📄 License

Proprietary - Company Internal Use Only
