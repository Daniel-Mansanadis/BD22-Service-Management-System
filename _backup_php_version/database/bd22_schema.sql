-- BD22 Fire System & Builders Inc.
-- Relational Database Schema & Initial Data
-- Target Engine: MariaDB 10.4+ / MySQL 8.0+

CREATE DATABASE IF NOT EXISTS `bd22_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `bd22_db`;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `admin_notifications`;
DROP TABLE IF EXISTS `customer_messages`;
DROP TABLE IF EXISTS `service_history`;
DROP TABLE IF EXISTS `maintenance_schedules`;
DROP TABLE IF EXISTS `warranties`;
DROP TABLE IF EXISTS `payments`;
DROP TABLE IF EXISTS `project_equipment`;
DROP TABLE IF EXISTS `inventory_items`;
DROP TABLE IF EXISTS `projects`;
DROP TABLE IF EXISTS `service_requests`;
DROP TABLE IF EXISTS `inquiries`;
DROP TABLE IF EXISTS `services`;
DROP TABLE IF EXISTS `users`;

SET FOREIGN_KEY_CHECKS = 1;

-- --------------------------------------------------------
-- Table: users
-- --------------------------------------------------------
CREATE TABLE `users` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `role` ENUM('admin', 'customer') NOT NULL DEFAULT 'customer',
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(150) NOT NULL,
  `first_name` VARCHAR(75) NULL,
  `last_name` VARCHAR(75) NULL,
  `company` VARCHAR(150) NULL,
  `phone` VARCHAR(50) NULL,
  `pref_sms` TINYINT(1) NOT NULL DEFAULT 1,
  `pref_email` TINYINT(1) NOT NULL DEFAULT 1,
  `pref_warranty` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_users_role` (`role`),
  INDEX `idx_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table: services
-- --------------------------------------------------------
CREATE TABLE `services` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `slug` VARCHAR(50) NOT NULL UNIQUE,
  `title` VARCHAR(150) NOT NULL,
  `overview` TEXT NOT NULL,
  `description` TEXT NOT NULL,
  `standards` JSON NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table: inquiries
-- --------------------------------------------------------
CREATE TABLE `inquiries` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `reference_no` VARCHAR(50) NOT NULL UNIQUE,
  `user_id` INT UNSIGNED NULL,
  `customer_name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `phone` VARCHAR(50) NOT NULL,
  `service_name` VARCHAR(150) NOT NULL,
  `message` TEXT NOT NULL,
  `status` ENUM('Pending Review', 'Scheduled', 'In Progress', 'Completed') NOT NULL DEFAULT 'Pending Review',
  `assigned_staff` VARCHAR(100) NOT NULL DEFAULT 'Unassigned',
  `tracking_note` TEXT NULL,
  `last_update` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_inq_status` (`status`),
  INDEX `idx_inq_ref` (`reference_no`),
  INDEX `idx_inq_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table: service_requests
-- --------------------------------------------------------
CREATE TABLE `service_requests` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `reference_no` VARCHAR(50) NOT NULL UNIQUE,
  `user_id` INT UNSIGNED NOT NULL,
  `customer_name` VARCHAR(150) NOT NULL,
  `service_type` VARCHAR(150) NOT NULL,
  `urgency` ENUM('Standard Maintenance', 'Priority', 'Emergency / Urgent') NOT NULL DEFAULT 'Standard Maintenance',
  `notes` TEXT NOT NULL,
  `status` ENUM('Urgent', 'Scheduled', 'In Progress', 'Completed') NOT NULL DEFAULT 'Scheduled',
  `assigned_staff` VARCHAR(100) NOT NULL DEFAULT 'Unassigned',
  `last_update` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_sr_user` (`user_id`),
  INDEX `idx_sr_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table: projects
-- --------------------------------------------------------
CREATE TABLE `projects` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `project_code` VARCHAR(50) NOT NULL UNIQUE,
  `user_id` INT UNSIGNED NULL,
  `name` VARCHAR(200) NOT NULL,
  `customer_name` VARCHAR(150) NOT NULL,
  `assigned_team` VARCHAR(150) NOT NULL,
  `progress` TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `target_date` DATE NOT NULL,
  `status` ENUM('In Progress', 'Completed', 'Scheduled') NOT NULL DEFAULT 'In Progress',
  `milestones` TEXT NOT NULL,
  `description` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_proj_status` (`status`),
  INDEX `idx_proj_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table: inventory_items
-- --------------------------------------------------------
CREATE TABLE `inventory_items` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `item_code` VARCHAR(50) NOT NULL UNIQUE,
  `name` VARCHAR(150) NOT NULL,
  `item_type` VARCHAR(100) NOT NULL,
  `quantity` INT UNSIGNED NOT NULL DEFAULT 0,
  `customer_project` VARCHAR(200) NOT NULL,
  `service_status` ENUM('Current', 'Due') NOT NULL DEFAULT 'Current',
  `next_maintenance` VARCHAR(50) NOT NULL,
  `stock_status` ENUM('Available', 'Low Stock') NOT NULL DEFAULT 'Available',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_inv_stock` (`stock_status`),
  INDEX `idx_inv_type` (`item_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table: project_equipment
-- --------------------------------------------------------
CREATE TABLE `project_equipment` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `project_id` INT UNSIGNED NOT NULL,
  `inventory_item_id` INT UNSIGNED NOT NULL,
  `quantity_installed` INT UNSIGNED NOT NULL DEFAULT 1,
  `installed_date` DATE NOT NULL,
  `serial_number` VARCHAR(100) NULL,
  `location_notes` VARCHAR(255) NULL,
  FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`inventory_item_id`) REFERENCES `inventory_items`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table: payments
-- --------------------------------------------------------
CREATE TABLE `payments` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `invoice_no` VARCHAR(50) NOT NULL UNIQUE,
  `project_id` INT UNSIGNED NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `project_name` VARCHAR(200) NOT NULL,
  `customer_name` VARCHAR(150) NOT NULL,
  `amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `due_date` DATE NOT NULL,
  `status` ENUM('Partial', 'Overdue', 'Paid') NOT NULL DEFAULT 'Partial',
  `payment_method` VARCHAR(50) NULL,
  `payment_reference` VARCHAR(100) NULL,
  `paid_at` DATETIME NULL,
  `assigned_staff` VARCHAR(100) NOT NULL DEFAULT 'Accounting',
  `last_update` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_pay_user` (`user_id`),
  INDEX `idx_pay_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table: warranties
-- --------------------------------------------------------
CREATE TABLE `warranties` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `warranty_code` VARCHAR(50) NOT NULL UNIQUE,
  `user_id` INT UNSIGNED NOT NULL,
  `project_id` INT UNSIGNED NULL,
  `title` VARCHAR(200) NOT NULL,
  `customer_name` VARCHAR(150) NOT NULL,
  `coverage` TEXT NOT NULL,
  `install_date` DATE NOT NULL,
  `expiry_date` DATE NOT NULL,
  `status` ENUM('Active', 'Expiring Soon', 'Expired') NOT NULL DEFAULT 'Active',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE SET NULL,
  INDEX `idx_warr_user` (`user_id`),
  INDEX `idx_warr_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table: maintenance_schedules
-- --------------------------------------------------------
CREATE TABLE `maintenance_schedules` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `maintenance_code` VARCHAR(50) NOT NULL UNIQUE,
  `user_id` INT UNSIGNED NOT NULL,
  `project_id` INT UNSIGNED NULL,
  `title` VARCHAR(200) NOT NULL,
  `customer_name` VARCHAR(150) NOT NULL,
  `technician` VARCHAR(100) NOT NULL,
  `scheduled_date` DATE NOT NULL,
  `status` ENUM('Overdue', 'Due', 'Upcoming', 'Completed') NOT NULL DEFAULT 'Upcoming',
  `notes` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE SET NULL,
  INDEX `idx_maint_user` (`user_id`),
  INDEX `idx_maint_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table: service_history
-- --------------------------------------------------------
CREATE TABLE `service_history` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NULL,
  `project_id` INT UNSIGNED NULL,
  `reference_code` VARCHAR(50) NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `description` TEXT NOT NULL,
  `event_type` VARCHAR(50) NOT NULL DEFAULT 'Inspection',
  `event_date` DATE NOT NULL,
  `performed_by` VARCHAR(100) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE SET NULL,
  INDEX `idx_hist_user` (`user_id`),
  INDEX `idx_hist_date` (`event_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table: customer_messages
-- --------------------------------------------------------
CREATE TABLE `customer_messages` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `description` TEXT NOT NULL,
  `is_read` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_cmsg_user` (`user_id`, `is_read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table: admin_notifications
-- --------------------------------------------------------
CREATE TABLE `admin_notifications` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(200) NOT NULL,
  `description` TEXT NULL,
  `status` ENUM('New', 'Overdue', 'Read') NOT NULL DEFAULT 'New',
  `action_url` VARCHAR(255) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_anotif_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- SEED DATA: Services Catalog
-- --------------------------------------------------------
INSERT INTO `services` (`slug`, `title`, `overview`, `description`, `standards`) VALUES
('sprinkler', 'Fire Sprinkler Retrofit & Installation', 'Engineered automatic wet and dry pipe fire sprinkler systems designed in compliance with NFPA 13 and Revised Fire Code of the Philippines (RA 9514).', 'Full design, hydraulic calculations, pipe fabrication, riser installation, tamper-switch instrumentation, and flow testing for high-occupancy commercial and industrial properties.', '["NFPA 13: Standard for Installation of Sprinkler Systems", "RA 9514: Fire Code of the Philippines 2019", "UL / FM Approved Components"]'),
('preaction', 'Pre-Action Suppression Systems', 'Double-interlock pre-action sprinkler systems for mission-critical facilities, preventing accidental water discharge onto sensitive electronic systems.', 'Integrates intelligent smoke detection with pre-action deluge valves. Ideal for enterprise data centers, server rooms, telecommunication hubs, and medical archives.', '["NFPA 13 & 15 Compliance", "Double-Interlock Electric/Pneumatic Actuation", "UL Listed Solenoids & Supervisory Pressure Switches"]'),
('cleanagent', 'Clean Agent FM-200 / Novec 1230', 'Waterless chemical fire extinguishing solutions leaving zero residue, non-conductive, and safe for occupied technical workspaces.', 'Rapid total-flooding extinguishing within 10 seconds of thermal/optical smoke trigger. Preserves enterprise IT infrastructure, electrical switchgear, and museum collections.', '["NFPA 2001: Clean Agent Extinguishing Systems", "EPA SNAP Approved Clean Agents", "UL 2166 / FM Global Approved Cylinders"]'),
('deluge', 'High-Velocity Deluge Water Spray', 'Rapid high-capacity deluge water spray systems for outdoor transformers, LPG bullet storage tanks, fuel loading racks, and chemical processing zones.', 'Open sprinkler nozzle configuration triggered by pneumatic detection loops or optical flame sensors for instantaneous cooling and fire suppression.', '["NFPA 15: Water Spray Fixed Systems", "API 2001 Fire Protection in Refineries", "BFP High Hazard Industrial Clearance"]'),
('standpipe', 'Standpipe & Fire Hose Stations', 'Class I, II, and III wet and dry standpipe risers providing immediate high-pressure fire stream connections for internal brigade and BFP firefighters.', 'Strategic riser layout, pressure regulating valves (PRV), Siamese fire department connections (FDC), and high-durability synthetic fire hose cabinets.', '["NFPA 14: Standard for Standpipe and Hose Systems", "UL Listed 2.5-inch Brass Valves & Angles", "BFP Standard Siamese 2-Way / 4-Way Inlets"]'),
('pms', 'Preventative Maintenance & Inspection (PMS)', 'Comprehensive quarterly and annual fire protection inspection contracts, hydrostatic tests, flow rate certifications, and BFP renewal audits.', 'Full system diagnostic audits, fire pump churn and peak load testing, valve lubrication, pressure gauge calibration, and fire drill support.', '["NFPA 25: Inspection, Testing, and Maintenance", "BFP FSIC Annual Certification Endorsement", "Digital Audit Trail & Cloud Inspection Certificates"]');

-- --------------------------------------------------------
-- SEED DATA: Sample Initial Inventory Items
-- --------------------------------------------------------
INSERT INTO `inventory_items` (`item_code`, `name`, `item_type`, `quantity`, `customer_project`, `service_status`, `next_maintenance`, `stock_status`) VALUES
('eq-1', 'Simplex 4007ES Addressable Fire Alarm Control Panel', 'Fire Alarm', 4, 'Apex Tower B - Ayala Ave', 'Current', 'Nov 2026', 'Available'),
('eq-2', 'Viking Model G-1 Concealed Pendent Sprinkler Heads (1/2" NPT)', 'Sprinkler', 1, 'Arden Manufacturing Plant 1', 'Due', 'Immediate', 'Low Stock'),
('eq-3', 'Fike 200-lb FM-200 Engineered Gas Cylinder & Valve', 'Clean Agent', 5, 'DataVault Server Facility', 'Current', 'Jan 2027', 'Available'),
('eq-4', 'Cooper Emergency Exit Sign LED with 3-Hour NiCd Battery Backup', 'Emergency Lighting', 18, 'Pacific Rim Logistics Hub', 'Current', 'Dec 2026', 'Available'),
('eq-5', 'Potter 4-inch Vane-Type Waterflow Detector Switch (VSR)', 'Sprinkler', 2, 'St. Jude Medical Pavilion', 'Due', 'Immediate', 'Low Stock'),
('eq-6', 'Badger 20lb ABC Multi-Purpose Stored Pressure Fire Extinguisher', 'Extinguisher', 12, 'Grand Plaza Retail Mall', 'Current', 'Feb 2027', 'Available');

-- --------------------------------------------------------
-- SEED DATA: Sample System History Audit Log
-- --------------------------------------------------------
INSERT INTO `service_history` (`reference_code`, `title`, `description`, `event_type`, `event_date`, `performed_by`) VALUES
('HIST-2026-001', 'Annual Sprinkler Flow Rate Diagnostic', 'Conducted 2-hour churn and 150% peak flow load verification on main electric fire pump. Flow rates verified at 750 GPM @ 125 PSI.', 'Inspection', '2026-09-15', 'Engr. D. Santos'),
('HIST-2026-002', 'FM-200 Cylinder Weight & Pressure Recertification', 'Performed ultrasonic liquid level verification on 4 Clean Agent suppression cylinders. Pressure stable at 360 PSI at 21°C.', 'Maintenance', '2026-08-28', 'Tech. R. Valdez'),
('HIST-2026-003', 'BFP Fire Safety Inspection Certificate (FSIC) Endorsement', 'Completed Bureau of Fire Protection compliance verification. All risers, Siamese connections, and alarm panels passed inspection.', 'Certificate', '2026-08-10', 'Engr. M. Cruz'),
('HIST-2026-004', 'Emergency Exit Luminaire Battery Discharge Test', 'Simulated complete AC power failure test across 45 emergency luminaires. All units exceeded the mandatory 90-minute runtime requirement.', 'Testing', '2026-07-22', 'Tech. K. Ramos');

-- --------------------------------------------------------
-- SEED DATA: Admin Priority Alerts & Notifications
-- --------------------------------------------------------
INSERT INTO `admin_notifications` (`title`, `description`, `status`, `action_url`) VALUES
('High-Priority Maintenance Overdue: Arden Plant 1 Riser Valve', 'Quarterly deluge valve test is overdue by 5 business days for Arden Manufacturing.', 'Overdue', '#admin-maintenance'),
('Low Stock Notice: Viking Concealed Sprinkler Heads (1 unit remaining)', 'Warehouse inventory for 1/2" NPT sprinkler heads has fallen below reorder threshold.', 'New', '#admin-inventory'),
('New Customer Service Dispatch Request #REQ-2026-014', 'St. Jude Medical Pavilion requested emergency inspection on Section B booster pump.', 'New', '#admin-service-requests');
