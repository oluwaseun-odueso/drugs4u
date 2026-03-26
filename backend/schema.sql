-- Pharma4 PMS Database Schema
-- MySQL 9.2

CREATE DATABASE IF NOT EXISTS pharma4_pms
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE pharma4_pms;

-- ─── Staff / Users ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    user_id       INT AUTO_INCREMENT PRIMARY KEY,
    username      VARCHAR(50)  UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name     VARCHAR(100) NOT NULL,
    email         VARCHAR(100) UNIQUE NOT NULL,
    role          ENUM('admin', 'pharmacist') NOT NULL DEFAULT 'pharmacist',
    is_active     TINYINT(1) NOT NULL DEFAULT 1,
    last_login    TIMESTAMP NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ─── Customers ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customers (
    customer_id        INT AUTO_INCREMENT PRIMARY KEY,
    title              VARCHAR(10) NULL,
    first_name         VARCHAR(50)  NOT NULL,
    last_name          VARCHAR(50)  NOT NULL,
    date_of_birth      DATE         NOT NULL,
    address_line1      VARCHAR(100) NOT NULL,
    address_line2      VARCHAR(100) NULL,
    city               VARCHAR(50)  NOT NULL,
    postcode           VARCHAR(10)  NOT NULL,
    phone              VARCHAR(15)  NOT NULL,
    email              VARCHAR(100) NULL,
    nhs_number         VARCHAR(20)  NULL UNIQUE,
    allergies          TEXT NULL,
    drug_allergies     TEXT NULL,
    medical_conditions TEXT NULL,
    is_active          TINYINT(1) NOT NULL DEFAULT 1,
    created_by         INT NULL,
    created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (last_name, first_name),
    INDEX idx_dob  (date_of_birth),
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ─── Medications ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS medications (
    medication_id         INT AUTO_INCREMENT PRIMARY KEY,
    medication_name       VARCHAR(100) NOT NULL,
    generic_name          VARCHAR(100) NULL,
    strength              VARCHAR(50)  NULL,
    form                  VARCHAR(50)  NULL,
    manufacturer          VARCHAR(100) NULL,
    requires_prescription TINYINT(1) NOT NULL DEFAULT 1,
    age_restricted        TINYINT(1) NOT NULL DEFAULT 0,
    min_age_years         INT NULL CHECK (min_age_years >= 0),
    controlled_drug       TINYINT(1) NOT NULL DEFAULT 0,
    requires_id_check     TINYINT(1) NOT NULL DEFAULT 0,
    low_stock_threshold   INT NOT NULL DEFAULT 10,
    created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_med_name (medication_name)
) ENGINE=InnoDB;

-- ─── Inventory ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inventory (
    inventory_id        INT AUTO_INCREMENT PRIMARY KEY,
    medication_id       INT  NOT NULL,
    batch_number        VARCHAR(50) NOT NULL,
    quantity            INT  NOT NULL CHECK (quantity >= 0),
    expiry_date         DATE NOT NULL,
    low_stock_threshold INT  NOT NULL DEFAULT 10,
    received_date       DATE NOT NULL DEFAULT (CURRENT_DATE),
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE INDEX idx_batch (medication_id, batch_number),
    INDEX idx_expiry     (expiry_date),
    INDEX idx_qty        (quantity),
    FOREIGN KEY (medication_id) REFERENCES medications(medication_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ─── Prescriptions ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prescriptions (
    prescription_id   INT AUTO_INCREMENT PRIMARY KEY,
    customer_id       INT  NOT NULL,
    prescription_date DATE NOT NULL DEFAULT (CURRENT_DATE),
    prescribed_by     VARCHAR(100) NULL,
    status            ENUM('pending', 'dispensed', 'cancelled') NOT NULL DEFAULT 'pending',
    notes             TEXT NULL,
    created_by        INT  NOT NULL,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_presc_date   (prescription_date),
    INDEX idx_cust_date    (customer_id, prescription_date),
    INDEX idx_status       (status),
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id)  ON DELETE RESTRICT,
    FOREIGN KEY (created_by)  REFERENCES users(user_id)          ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ─── Prescription Items ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prescription_items (
    item_id              INT AUTO_INCREMENT PRIMARY KEY,
    prescription_id      INT  NOT NULL,
    inventory_id         INT  NOT NULL,
    medication_id        INT  NOT NULL,
    quantity_dispensed   INT  NOT NULL CHECK (quantity_dispensed > 0),
    dosage_instructions  VARCHAR(255) NULL,
    status               ENUM('pending', 'dispensed', 'cancelled') NOT NULL DEFAULT 'pending',
    dispensed_date       DATE NULL,
    dispensed_by         INT  NULL,
    created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_presc_items (prescription_id),
    FOREIGN KEY (prescription_id) REFERENCES prescriptions(prescription_id)  ON DELETE CASCADE,
    FOREIGN KEY (inventory_id)    REFERENCES inventory(inventory_id)          ON DELETE RESTRICT,
    FOREIGN KEY (medication_id)   REFERENCES medications(medication_id)       ON DELETE RESTRICT,
    FOREIGN KEY (dispensed_by)    REFERENCES users(user_id)                   ON DELETE SET NULL
) ENGINE=InnoDB;

-- ─── Alerts Log ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS alerts_log (
    alert_id          INT AUTO_INCREMENT PRIMARY KEY,
    alert_type        ENUM('age_check', 'low_stock', 'expiry', 'allergy') NOT NULL,
    severity          ENUM('info', 'warning', 'critical') NOT NULL DEFAULT 'warning',
    customer_id       INT NULL,
    prescription_id   INT NULL,
    medication_id     INT NULL,
    inventory_id      INT NULL,
    user_id           INT NOT NULL,
    message           VARCHAR(255) NOT NULL,
    was_acknowledged  TINYINT(1) NOT NULL DEFAULT 0,
    acknowledged_by   INT NULL,
    acknowledged_at   TIMESTAMP NULL,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_alert_date (created_at),
    INDEX idx_alert_type (alert_type),
    FOREIGN KEY (customer_id)     REFERENCES customers(customer_id)   ON DELETE SET NULL,
    FOREIGN KEY (prescription_id) REFERENCES prescriptions(prescription_id) ON DELETE SET NULL,
    FOREIGN KEY (medication_id)   REFERENCES medications(medication_id)     ON DELETE SET NULL,
    FOREIGN KEY (inventory_id)    REFERENCES inventory(inventory_id)        ON DELETE SET NULL,
    FOREIGN KEY (user_id)         REFERENCES users(user_id)                 ON DELETE RESTRICT,
    FOREIGN KEY (acknowledged_by) REFERENCES users(user_id)                 ON DELETE SET NULL
) ENGINE=InnoDB;

-- ─── Seed: default users (password: admin123) ────────────────────────────────
INSERT IGNORE INTO users (username, password_hash, full_name, email, role)
VALUES ('admin', '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'System Administrator', 'admin@drugs4u.local', 'admin');
INSERT IGNORE INTO users (username, password_hash, full_name, email, role)
VALUES ('pharmacist', '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Staff Pharmacist', 'pharmacist@drugs4u.local', 'pharmacist');

-- ─── Seed: sample medications ────────────────────────────────────────────────
INSERT IGNORE INTO medications (medication_id, medication_name, generic_name, strength, form, manufacturer, requires_prescription, age_restricted, min_age_years, controlled_drug, requires_id_check, low_stock_threshold)
VALUES
(1, 'Paracetamol',        'Acetaminophen', '500mg',   'Tablet',  'Generic Pharma',  0, 0, NULL, 0, 0, 10),
(2, 'Ibuprofen',          'Ibuprofen',     '400mg',   'Tablet',  'Generic Pharma',  0, 1, 16,   0, 1, 10),
(3, 'Amoxicillin',        'Amoxicillin',   '250mg',   'Capsule', 'Antibiotics Ltd', 1, 0, NULL, 0, 0, 10),
(4, 'Codeine Phosphate',  'Codeine',       '30mg',    'Tablet',  'Pain Relief Co',  1, 1, 18,   1, 1, 10),
(5, 'Ventolin Inhaler',   'Salbutamol',    '100mcg',  'Inhaler', 'Respirex',        1, 0, NULL, 0, 0, 10),
(6, 'Diazepam',           'Diazepam',      '5mg',     'Tablet',  'Tranquil Pharma', 1, 1, 18,   1, 1, 5);
