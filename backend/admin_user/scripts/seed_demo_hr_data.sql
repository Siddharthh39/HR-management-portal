USE hr_management;

CREATE TABLE IF NOT EXISTS leave_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  leave_type VARCHAR(50) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days DECIMAL(4,1) NOT NULL,
  reason TEXT NOT NULL,
  status VARCHAR(30) NOT NULL,
  applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  approved_by INT NULL,
  comments TEXT NULL,
  CONSTRAINT fk_leave_requests_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_leave_requests_approved_by FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS onboarding_tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  task_name VARCHAR(120) NOT NULL,
  assigned_to INT NULL,
  status VARCHAR(30) NOT NULL,
  due_date DATE NULL,
  completed_at DATETIME NULL,
  notes TEXT NULL,
  CONSTRAINT fk_onboarding_tasks_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_onboarding_tasks_assigned_to FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  work_date DATE NOT NULL,
  punch_in_time DATETIME NULL,
  punch_out_time DATETIME NULL,
  total_hours DECIMAL(5,2) NOT NULL DEFAULT 0,
  overtime_hours DECIMAL(5,2) NOT NULL DEFAULT 0,
  status VARCHAR(30) NOT NULL,
  location VARCHAR(100) NULL,
  notes TEXT NULL,
  UNIQUE KEY unique_user_date (user_id, work_date),
  CONSTRAINT fk_attendance_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS salary_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  pay_period_start DATE NOT NULL,
  pay_period_end DATE NOT NULL,
  base_salary DECIMAL(12,2) NOT NULL,
  allowances DECIMAL(12,2) NOT NULL DEFAULT 0,
  deductions DECIMAL(12,2) NOT NULL DEFAULT 0,
  net_salary DECIMAL(12,2) NOT NULL,
  pay_date DATE NOT NULL,
  payment_status VARCHAR(30) NOT NULL,
  remarks TEXT NULL,
  UNIQUE KEY unique_pay_period (user_id, pay_period_start, pay_period_end),
  CONSTRAINT fk_salary_records_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO users (full_name, email, password_hash, status, is_admin)
VALUES
  ('Priya Nair', 'priya.nair@hr.local', 'Employee123!', 'active', 0),
  ('Arun Kumar', 'arun.kumar@hr.local', 'Employee123!', 'active', 0),
  ('Meera Iyer', 'meera.iyer@hr.local', 'Employee123!', 'active', 0),
  ('Vikram Singh', 'vikram.singh@hr.local', 'Employee123!', 'active', 0)
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name),
  password_hash = VALUES(password_hash),
  status = VALUES(status),
  is_admin = VALUES(is_admin);

SET @admin_id := (SELECT id FROM users WHERE email = 'admin@hr.local' LIMIT 1);
SET @hr_exec_id := (SELECT id FROM users WHERE email = 'hr.executive@hr.local' LIMIT 1);
SET @priya_id := (SELECT id FROM users WHERE email = 'priya.nair@hr.local' LIMIT 1);
SET @arun_id := (SELECT id FROM users WHERE email = 'arun.kumar@hr.local' LIMIT 1);
SET @meera_id := (SELECT id FROM users WHERE email = 'meera.iyer@hr.local' LIMIT 1);
SET @vikram_id := (SELECT id FROM users WHERE email = 'vikram.singh@hr.local' LIMIT 1);

DELETE FROM leave_requests;
DELETE FROM onboarding_tasks;
DELETE FROM attendance;
DELETE FROM salary_records;

INSERT INTO leave_requests (user_id, leave_type, start_date, end_date, days, reason, status, applied_at, approved_by, comments)
VALUES
  (@priya_id, 'Casual Leave', '2026-04-15', '2026-04-16', 2.0, 'Family event', 'APPROVED', '2026-04-10 09:15:00', @admin_id, 'Approved for two days'),
  (@arun_id, 'Sick Leave', '2026-04-17', '2026-04-17', 1.0, 'Flu and fever', 'PENDING', '2026-04-13 11:30:00', NULL, NULL),
  (@meera_id, 'Earned Leave', '2026-04-22', '2026-04-24', 3.0, 'Personal travel', 'APPROVED', '2026-04-08 14:45:00', @hr_exec_id, 'Approved by HR'),
  (@vikram_id, 'Casual Leave', '2026-04-20', '2026-04-20', 1.0, 'Medical appointment', 'REJECTED', '2026-04-12 16:00:00', @admin_id, 'Insufficient leave balance');

INSERT INTO onboarding_tasks (user_id, task_name, assigned_to, status, due_date, completed_at, notes)
VALUES
  (@priya_id, 'Submit identity documents', @admin_id, 'COMPLETED', '2026-04-01', '2026-04-01 10:30:00', 'Documents verified'),
  (@priya_id, 'Complete policy acknowledgment', @admin_id, 'COMPLETED', '2026-04-02', '2026-04-02 15:10:00', 'Signed digitally'),
  (@arun_id, 'Set up workstation', @hr_exec_id, 'IN_PROGRESS', '2026-04-18', NULL, 'Laptop issued, awaiting access card'),
  (@meera_id, 'HR induction session', @hr_exec_id, 'COMPLETED', '2026-04-03', '2026-04-03 12:00:00', 'Completed with Q&A'),
  (@vikram_id, 'Bank account verification', @admin_id, 'PENDING', '2026-04-19', NULL, 'Waiting for document upload');

INSERT INTO attendance (user_id, work_date, punch_in_time, punch_out_time, total_hours, overtime_hours, status, location, notes)
VALUES
  (@priya_id, '2026-04-11', '2026-04-11 09:12:00', '2026-04-11 18:18:00', 9.10, 0.50, 'PRESENT', 'Mumbai Office', 'Regular working day'),
  (@priya_id, '2026-04-12', '2026-04-12 09:05:00', '2026-04-12 18:02:00', 8.95, 0.20, 'PRESENT', 'Mumbai Office', 'Client review'),
  (@arun_id, '2026-04-11', '2026-04-11 10:00:00', '2026-04-11 19:00:00', 9.00, 1.00, 'PRESENT', 'Remote', 'Worked late on onboarding tasks'),
  (@meera_id, '2026-04-11', '2026-04-11 09:30:00', '2026-04-11 17:45:00', 8.25, 0.00, 'PRESENT', 'Bangalore Office', 'Training batch support'),
  (@vikram_id, '2026-04-11', '2026-04-11 09:20:00', '2026-04-11 18:10:00', 8.83, 0.33, 'PRESENT', 'Mumbai Office', 'Deployment support');

INSERT INTO salary_records (user_id, pay_period_start, pay_period_end, base_salary, allowances, deductions, net_salary, pay_date, payment_status, remarks)
VALUES
  (@priya_id, '2026-04-01', '2026-04-30', 85000.00, 12000.00, 3500.00, 93500.00, '2026-04-30', 'PROCESSING', 'April payroll in progress'),
  (@arun_id, '2026-04-01', '2026-04-30', 72000.00, 9000.00, 2200.00, 78800.00, '2026-04-30', 'PROCESSING', 'Includes performance allowance'),
  (@meera_id, '2026-04-01', '2026-04-30', 91000.00, 15000.00, 4100.00, 102900.00, '2026-04-30', 'PAID', 'Paid via bank transfer'),
  (@vikram_id, '2026-04-01', '2026-04-30', 68000.00, 8000.00, 1800.00, 74200.00, '2026-04-30', 'PROCESSING', 'Awaiting approval');
