CREATE DATABASE IF NOT EXISTS hr_management
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE hr_management;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'active',
  is_admin TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT NULL
);

CREATE TABLE IF NOT EXISTS user_permissions (
  user_id INT NOT NULL,
  permission_id INT NOT NULL,
  PRIMARY KEY (user_id, permission_id),
  CONSTRAINT fk_user_permissions_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_user_permissions_permission
    FOREIGN KEY (permission_id)
    REFERENCES permissions(id)
    ON DELETE CASCADE
);

INSERT INTO permissions (name, description)
VALUES ('aws.ec2', 'Allows user to access EC2 management scope.')
ON DUPLICATE KEY UPDATE description = VALUES(description);

INSERT INTO users (full_name, email, password_hash, status, is_admin)
VALUES ('Platform Admin', 'admin@hr.local', 'ChangeMe123!', 'active', 1)
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name),
  password_hash = VALUES(password_hash),
  status = VALUES(status),
  is_admin = VALUES(is_admin);

INSERT INTO users (full_name, email, password_hash, status, is_admin)
VALUES ('HR Executive', 'hr.executive@hr.local', 'HrExec123!', 'active', 0)
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name),
  password_hash = VALUES(password_hash),
  status = VALUES(status),
  is_admin = VALUES(is_admin);

INSERT INTO user_permissions (user_id, permission_id)
SELECT u.id, p.id
FROM users u
JOIN permissions p ON p.name = 'aws.ec2'
WHERE u.email IN ('admin@hr.local', 'hr.executive@hr.local')
ON DUPLICATE KEY UPDATE user_id = VALUES(user_id);
