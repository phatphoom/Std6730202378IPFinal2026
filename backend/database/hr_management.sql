-- HR Management Database Schema & Seed Data
-- MySQL 8.x compatible
-- Database: ip_std6730202378

CREATE DATABASE IF NOT EXISTS ip_std6730202378
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE ip_std6730202378;

-- ============================================================
-- 1. DEPARTMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS departments (
  department_id       VARCHAR(10)  NOT NULL,
  name                VARCHAR(100) NOT NULL,
  code                VARCHAR(20)  NOT NULL,
  manager_employee_id VARCHAR(10)  DEFAULT NULL,
  created_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (department_id),
  UNIQUE KEY uq_dept_name (name),
  UNIQUE KEY uq_dept_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 2. EMPLOYEES
-- ============================================================
CREATE TABLE IF NOT EXISTS employees (
  employee_id   VARCHAR(10)  NOT NULL,
  first_name    VARCHAR(100) NOT NULL,
  last_name     VARCHAR(100) NOT NULL,
  email         VARCHAR(255) NOT NULL,
  password      VARCHAR(255) NOT NULL,
  phone         VARCHAR(20)  DEFAULT NULL,
  department_id VARCHAR(10)  DEFAULT NULL,
  position      VARCHAR(100) DEFAULT NULL,
  salary        DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  role          ENUM('admin','manager','employee') NOT NULL DEFAULT 'employee',
  status        ENUM('active','inactive') NOT NULL DEFAULT 'active',
  start_date    DATE         DEFAULT NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (employee_id),
  UNIQUE KEY uq_emp_email (email),
  CONSTRAINT fk_emp_dept FOREIGN KEY (department_id) REFERENCES departments (department_id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add FK from departments.manager_employee_id -> employees.employee_id
ALTER TABLE departments
  ADD CONSTRAINT fk_dept_manager
  FOREIGN KEY (manager_employee_id) REFERENCES employees (employee_id)
  ON UPDATE CASCADE ON DELETE SET NULL;

-- ============================================================
-- 3. ATTENDANCE
-- ============================================================
CREATE TABLE IF NOT EXISTS attendance (
  attendance_id  VARCHAR(15) NOT NULL,
  employee_id    VARCHAR(10) NOT NULL,
  check_in_time  DATETIME    NOT NULL,
  check_out_time DATETIME    DEFAULT NULL,
  created_at     DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (attendance_id),
  CONSTRAINT fk_att_emp FOREIGN KEY (employee_id) REFERENCES employees (employee_id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 4. LEAVE REQUESTS
-- ============================================================
CREATE TABLE IF NOT EXISTS leave_requests (
  leave_id     VARCHAR(15)  NOT NULL,
  employee_id  VARCHAR(10)  NOT NULL,
  leave_type   VARCHAR(50)  NOT NULL,
  start_date   DATE         NOT NULL,
  end_date     DATE         NOT NULL,
  reason       TEXT         DEFAULT NULL,
  status       ENUM('pending','approved','rejected','cancelled') NOT NULL DEFAULT 'pending',
  decided_by   VARCHAR(10)  DEFAULT NULL,
  comment      TEXT         DEFAULT NULL,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (leave_id),
  CONSTRAINT fk_lv_emp     FOREIGN KEY (employee_id) REFERENCES employees (employee_id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_lv_decider FOREIGN KEY (decided_by) REFERENCES employees (employee_id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- SEED DATA
-- Default password for all seed accounts is: password123
-- Bcrypt hash (rounds=10): $2a$10$0l362SBdtsgVIwNH2UY/sO4qWr3MLRzV625gTw8U04WK5VYluUUUa
-- ============================================================

-- 1. Insert Departments first (without manager_employee_id)
INSERT INTO departments (department_id, name, code, manager_employee_id) VALUES
  ('DEP-0001', 'Human Resources', 'HR', NULL),
  ('DEP-0002', 'Information Technology', 'IT', NULL),
  ('DEP-0003', 'Finance & Accounting', 'ACC', NULL),
  ('DEP-0004', 'Marketing & Sales', 'MKT', NULL)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- 2. Insert Employees
INSERT INTO employees (employee_id, first_name, last_name, email, password, phone, department_id, position, salary, role, status, start_date) VALUES
  ('EMP-0001', 'Somchai', 'Jaidee', 'admin@company.com', '$2a$10$0l362SBdtsgVIwNH2UY/sO4qWr3MLRzV625gTw8U04WK5VYluUUUa', '0812345678', 'DEP-0001', 'HR Director', 85000.00, 'admin', 'active', '2023-01-15'),
  ('EMP-0002', 'Kanya', 'Dee', 'kanya@company.com', '$2a$10$0l362SBdtsgVIwNH2UY/sO4qWr3MLRzV625gTw8U04WK5VYluUUUa', '0823456789', 'DEP-0001', 'HR Manager', 55000.00, 'manager', 'active', '2023-03-01'),
  ('EMP-0003', 'Anong', 'Saelim', 'anong@company.com', '$2a$10$0l362SBdtsgVIwNH2UY/sO4qWr3MLRzV625gTw8U04WK5VYluUUUa', '0834567890', 'DEP-0001', 'HR Officer', 22000.00, 'employee', 'active', '2024-02-01'),
  ('EMP-0004', 'Somsak', 'Panya', 'somsak@company.com', '$2a$10$0l362SBdtsgVIwNH2UY/sO4qWr3MLRzV625gTw8U04WK5VYluUUUa', '0845678901', 'DEP-0002', 'Software Engineer', 48000.00, 'employee', 'active', '2024-05-15'),
  ('EMP-0005', 'Wanna', 'Sriwan', 'wanna@company.com', '$2a$10$0l362SBdtsgVIwNH2UY/sO4qWr3MLRzV625gTw8U04WK5VYluUUUa', '0856789012', 'DEP-0003', 'Senior Accountant', 52000.00, 'employee', 'active', '2024-06-01'),
  ('EMP-0006', 'Nicha', 'Wong', 'nicha@company.com', '$2a$10$0l362SBdtsgVIwNH2UY/sO4qWr3MLRzV625gTw8U04WK5VYluUUUa', '0867890123', 'DEP-0002', 'Senior Architect', 90000.00, 'employee', 'active', '2022-11-01'),
  ('EMP-0007', 'Anan', 'Srisuk', 'anan@company.com', '$2a$10$0l362SBdtsgVIwNH2UY/sO4qWr3MLRzV625gTw8U04WK5VYluUUUa', '0878901234', 'DEP-0002', 'Junior Developer', 18500.00, 'employee', 'active', '2024-08-01')
ON DUPLICATE KEY UPDATE email = VALUES(email);

-- 3. Set Department Managers now that employees exist
UPDATE departments SET manager_employee_id = 'EMP-0002' WHERE department_id = 'DEP-0001';
UPDATE departments SET manager_employee_id = 'EMP-0004' WHERE department_id = 'DEP-0002';
UPDATE departments SET manager_employee_id = 'EMP-0005' WHERE department_id = 'DEP-0003';

-- 4. Insert Attendance history
INSERT INTO attendance (attendance_id, employee_id, check_in_time, check_out_time) VALUES
  ('ATT-0001', 'EMP-0003', '2026-10-14 08:57:00', '2026-10-14 17:24:00'),
  ('ATT-0002', 'EMP-0003', '2026-10-13 09:03:00', '2026-10-13 17:31:00'),
  ('ATT-0003', 'EMP-0004', '2026-10-14 08:45:00', '2026-10-14 18:02:00'),
  ('ATT-0004', 'EMP-0001', '2026-10-15 08:30:00', NULL)
ON DUPLICATE KEY UPDATE attendance_id = VALUES(attendance_id);

-- 5. Insert Leave Requests
INSERT INTO leave_requests (leave_id, employee_id, leave_type, start_date, end_date, reason, status, decided_by, comment) VALUES
  ('LV-0001', 'EMP-0003', 'ลาพักร้อน', '2026-10-20', '2026-10-21', 'พักผ่อนประจำปีกับครอบครัว', 'pending', NULL, NULL),
  ('LV-0002', 'EMP-0004', 'ลาป่วย', '2026-10-08', '2026-10-08', 'มีไข้และพบแพทย์ตามนัด', 'approved', 'EMP-0002', 'อนุมัติ ขอให้หายไวๆ ครับ'),
  ('LV-0003', 'EMP-0005', 'ลากิจ', '2026-10-25', '2026-10-25', 'ติดต่อราชการทำบัตรประชาชน', 'pending', NULL, NULL)
ON DUPLICATE KEY UPDATE leave_id = VALUES(leave_id);
