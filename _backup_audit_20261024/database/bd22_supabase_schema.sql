-- ========================================================
-- BD22 FIRE SYSTEM & BUILDERS INC.
-- PostgreSQL Schema & Initial Data for Supabase
-- Run this entire script in Supabase: Project -> SQL Editor -> New query -> Run
-- ========================================================

-- 1. DROP EXISTING TABLES IF ANY (in dependency order)
DROP TABLE IF EXISTS admin_notifications CASCADE;
DROP TABLE IF EXISTS customer_messages CASCADE;
DROP TABLE IF EXISTS service_history CASCADE;
DROP TABLE IF EXISTS maintenance_schedules CASCADE;
DROP TABLE IF EXISTS warranties CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS project_equipment CASCADE;
DROP TABLE IF EXISTS inventory_items CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS service_requests CASCADE;
DROP TABLE IF EXISTS inquiries CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 2. CREATE TABLES

-- Table: users
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  role VARCHAR(20) NOT NULL DEFAULT 'customer' CHECK (role IN ('admin', 'customer')),
  email VARCHAR(191) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  first_name VARCHAR(75),
  last_name VARCHAR(75),
  company VARCHAR(150),
  phone VARCHAR(50),
  pref_sms BOOLEAN NOT NULL DEFAULT true,
  pref_email BOOLEAN NOT NULL DEFAULT true,
  pref_warranty BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);

-- Table: services
CREATE TABLE services (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(50) NOT NULL UNIQUE,
  title VARCHAR(150) NOT NULL,
  overview TEXT NOT NULL,
  description TEXT NOT NULL,
  standards JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: inquiries
CREATE TABLE inquiries (
  id SERIAL PRIMARY KEY,
  reference_no VARCHAR(50) NOT NULL UNIQUE,
  user_id INT REFERENCES users(id) ON DELETE SET NULL,
  customer_name VARCHAR(150) NOT NULL,
  email VARCHAR(191) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  service_name VARCHAR(150) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'Pending Review' CHECK (status IN ('Pending Review', 'Scheduled', 'In Progress', 'Completed')),
  assigned_staff VARCHAR(100) NOT NULL DEFAULT 'Unassigned',
  tracking_note TEXT,
  last_update TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_inq_status ON inquiries(status);
CREATE INDEX idx_inq_ref ON inquiries(reference_no);
CREATE INDEX idx_inq_email ON inquiries(email);

-- Table: service_requests
CREATE TABLE service_requests (
  id SERIAL PRIMARY KEY,
  reference_no VARCHAR(50) NOT NULL UNIQUE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  customer_name VARCHAR(150) NOT NULL,
  service_type VARCHAR(150) NOT NULL,
  urgency VARCHAR(50) NOT NULL DEFAULT 'Standard Maintenance' CHECK (urgency IN ('Standard Maintenance', 'Priority', 'Emergency / Urgent')),
  notes TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'Scheduled' CHECK (status IN ('Urgent', 'Scheduled', 'In Progress', 'Completed')),
  assigned_staff VARCHAR(100) NOT NULL DEFAULT 'Unassigned',
  last_update TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sr_user ON service_requests(user_id);
CREATE INDEX idx_sr_status ON service_requests(status);

-- Table: projects
CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  project_code VARCHAR(50) NOT NULL UNIQUE,
  user_id INT REFERENCES users(id) ON DELETE SET NULL,
  name VARCHAR(150) NOT NULL,
  customer_name VARCHAR(150) NOT NULL,
  assigned_team VARCHAR(100) NOT NULL DEFAULT 'Team Alpha (Operations)',
  progress INT NOT NULL DEFAULT 0,
  target_date DATE,
  status VARCHAR(50) NOT NULL DEFAULT 'In Progress' CHECK (status IN ('Planning', 'In Progress', 'On Hold', 'Completed')),
  milestones TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_proj_status ON projects(status);
CREATE INDEX idx_proj_user ON projects(user_id);

-- Table: inventory_items
CREATE TABLE inventory_items (
  id SERIAL PRIMARY KEY,
  item_code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  item_type VARCHAR(100) NOT NULL,
  quantity INT NOT NULL DEFAULT 0,
  customer_project VARCHAR(150),
  service_status VARCHAR(50) NOT NULL DEFAULT 'Current',
  next_maintenance DATE,
  stock_status VARCHAR(50) NOT NULL DEFAULT 'Available' CHECK (stock_status IN ('Available', 'Low Stock', 'Out of Stock')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: project_equipment
CREATE TABLE project_equipment (
  id SERIAL PRIMARY KEY,
  project_id INT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  inventory_id INT NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
  allocated_qty INT NOT NULL DEFAULT 1,
  allocated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: payments
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  invoice_no VARCHAR(50) NOT NULL UNIQUE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id INT REFERENCES projects(id) ON DELETE SET NULL,
  customer_name VARCHAR(150) NOT NULL,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  due_date DATE NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Paid', 'Partial', 'Overdue', 'Pending')),
  method_used VARCHAR(50),
  payment_reference VARCHAR(100),
  last_update TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pay_user ON payments(user_id);
CREATE INDEX idx_pay_status ON payments(status);

-- Table: warranties
CREATE TABLE warranties (
  id SERIAL PRIMARY KEY,
  warranty_code VARCHAR(50) NOT NULL UNIQUE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id INT REFERENCES projects(id) ON DELETE SET NULL,
  customer_name VARCHAR(150) NOT NULL,
  system_covered VARCHAR(150) NOT NULL,
  install_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Expiring Soon', 'Expired')),
  coverage_summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_warr_user ON warranties(user_id);
CREATE INDEX idx_warr_status ON warranties(status);

-- Table: maintenance_schedules
CREATE TABLE maintenance_schedules (
  id SERIAL PRIMARY KEY,
  maintenance_code VARCHAR(50) NOT NULL UNIQUE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id INT REFERENCES projects(id) ON DELETE SET NULL,
  customer_name VARCHAR(150) NOT NULL,
  service_type VARCHAR(150) NOT NULL,
  scheduled_date DATE NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'Scheduled' CHECK (status IN ('Due', 'Scheduled', 'Overdue', 'Completed')),
  technician VARCHAR(100) NOT NULL DEFAULT 'Unassigned',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_maint_user ON maintenance_schedules(user_id);
CREATE INDEX idx_maint_status ON maintenance_schedules(status);

-- Table: service_history
CREATE TABLE service_history (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id INT REFERENCES projects(id) ON DELETE SET NULL,
  activity_type VARCHAR(100) NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  service_date DATE NOT NULL,
  badge VARCHAR(50) NOT NULL DEFAULT 'Routine Service',
  logged_by VARCHAR(100) NOT NULL DEFAULT 'System',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_hist_user ON service_history(user_id);

-- Table: customer_messages
CREATE TABLE customer_messages (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_msg_user ON customer_messages(user_id);

-- Table: admin_notifications
CREATE TABLE admin_notifications (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'New' CHECK (status IN ('New', 'Overdue', 'Read', 'Resolved')),
  action_url VARCHAR(255) NOT NULL DEFAULT '#',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notif_status ON admin_notifications(status);

-- ========================================================
-- 3. SEED INITIAL DATA (Matching BD22 Mockups Exactly)
-- ========================================================

-- Seed account passwords are disabled; provision credentials securely before use.
INSERT INTO users (id, role, email, password_hash, full_name, first_name, last_name, company, phone) VALUES
(1, 'admin', 'admin@bd22fire.com', '!disabled!', 'Engr. Roberto Dela Cruz', 'Roberto', 'Dela Cruz', 'BD22 Fire System Operations', '+63 917 888 2200'),
(2, 'customer', 'alex@gmail.com', '!disabled!', 'Engr. Alex Johnson', 'Alex', 'Johnson', 'Arden Manufacturing Corp.', '+63 917 888 7766');

-- Reset sequences to prevent duplicate key errors
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

-- Services Catalog
INSERT INTO services (slug, title, overview, description, standards) VALUES
('fire-sprinklers', 'Fire Sprinkler Systems', 'Complete wet and dry pipe automated suppression systems tailored to industrial specifications.', 'Complete wet, dry, and pre-action fire sprinkler installation, hydro-testing, flow calculation, and quarterly NFPA 13 certification.', '["NFPA 13", "BFP RA 9514", "UL Listed"]'),
('fire-alarm-detection', 'Fire Detection & Alarm System (FDAS)', 'Intelligent addressable and conventional alarm systems ensuring immediate warning signals.', 'Turnkey addressable smoke/heat detection, manual pull stations, strobe horns, and central annunciator panel integration per NFPA 72 standards.', '["NFPA 72", "PNS Standards", "BFP Certified"]'),
('suppression-systems', 'Special Hazard Suppression', 'Clean agent FM-200, Novec 1230, and kitchen hood chemical fire suppression.', 'Targeted clean agent fire protection systems for server rooms, data centers, laboratories, and industrial kitchen hoods requiring zero water damage.', '["NFPA 2001", "NFPA 96", "ISO 14520"]'),
('maintenance-compliance', 'BFP Compliance & Maintenance', 'Comprehensive preventive maintenance and Bureau of Fire Protection compliance testing.', 'Annual and semi-annual comprehensive maintenance audits, pump flow testing, extinguisher tagging, and full preparation for FSIC clearance.', '["BFP Fire Code 2008", "NFPA 25", "DOLE OSH"]');

-- Seed Inquiries
INSERT INTO inquiries (reference_no, user_id, customer_name, email, phone, service_name, message, status, assigned_staff, tracking_note, created_at) VALUES
('INQ-2026-1048', 2, 'Arden Manufacturing Ltd.', 'alex@gmail.com', '+63 917 555 1048', 'Sprinkler Retrofit', 'Facility expansion requires additional 80 sprinkler heads and pipe pressure balance.', 'Pending Review', 'M. Velasco', 'Our service team is reviewing site requirements and will coordinate the next activity.', '2026-10-02 09:30:00'),
('SRV-2026-0917', NULL, 'Meridian Property Group', 'facilities@meridian.ph', '+63 920 888 0917', 'Annual Fire Alarm Inspection', 'Periodic inspection and panel reset for residential tower.', 'Scheduled', 'J. Ramos', 'Technician dispatched for annual inspection on scheduled date.', '2026-09-29 14:15:00'),
('INQ-2026-1036', NULL, 'Cedar Grove Residences', 'admin@cedargrove.com', '+63 918 333 1036', 'Emergency Lighting Service', 'Battery backup failure on 3rd and 4th stairwells.', 'In Progress', 'A. Dela Cruz', 'Circuit troubleshooting and replacement units under procurement.', '2026-09-26 11:00:00'),
('SRV-2026-0894', NULL, 'Harborline Logistics', 'safety@harborline.ph', '+63 922 444 0894', 'Extinguisher Maintenance', 'Refill and hydrostatic testing for 45 dry chemical units.', 'Completed', 'L. Santos', 'All cylinders hydro-tested, tagged, and certified compliant with BFP.', '2026-09-18 16:40:00');

-- Seed Service Requests
INSERT INTO service_requests (reference_no, user_id, customer_name, service_type, urgency, notes, status, assigned_staff, created_at) VALUES
('REQ-2026-1048', 2, 'Arden Manufacturing Ltd.', 'Sprinkler Retrofit', 'Emergency / Urgent', 'Zone 4 main riser shows fluctuating pressure reading.', 'Urgent', 'M. Velasco', '2026-10-02 09:30:00'),
('SRV-2026-0917', 2, 'Arden Manufacturing Corp.', 'Annual Fire Alarm Inspection', 'Priority', 'Annual compliance audit for BFP FSIC renewal.', 'Scheduled', 'J. Ramos', '2026-09-29 14:15:00'),
('REQ-2026-1036', 2, 'Arden Manufacturing Corp.', 'Emergency Lighting Service', 'Standard Maintenance', 'Battery replacement for evacuation stairwell signage.', 'In Progress', 'A. Dela Cruz', '2026-09-26 11:00:00'),
('SRV-2026-0894', 2, 'Arden Manufacturing Corp.', 'Extinguisher Maintenance', 'Standard Maintenance', 'Semi-annual inspection and tag update across plant floor.', 'Completed', 'L. Santos', '2026-09-18 16:40:00');

-- Seed Projects
INSERT INTO projects (id, project_code, user_id, name, customer_name, assigned_team, progress, target_date, status, milestones, description) VALUES
(1, 'proj-1', 2, 'Warehouse Sprinkler Retrofit', 'Arden Manufacturing Ltd.', 'Team Alpha (Lead: Engr. Ramos)', 65, '2026-10-24', 'In Progress', 'Milestone 3 of 5: Main riser pipe assembly completed. Hydro-testing scheduled for Thursday morning.', 'Retrofit and extension of NFPA-13 compliant sprinkler system across Warehouse 3 and 4.'),
(2, 'proj-2', NULL, 'Central Tower Alarm Upgrade', 'Meridian Property Group', 'Team Beta (Lead: Tech. Velasco)', 90, '2026-10-15', 'In Progress', 'Milestone 4 of 4: Final BFP inspection run and smoke detection verification.', 'Addressable alarm system replacement with multi-sensor smoke detectors across 18 floors.');

SELECT setval('projects_id_seq', (SELECT MAX(id) FROM projects));

-- Seed Inventory
INSERT INTO inventory_items (id, item_code, name, item_type, quantity, customer_project, service_status, next_maintenance, stock_status) VALUES
(1, 'eq-1', 'Sprinkler Head Pendent (K-5.6)', 'Sprinkler Component', 142, 'Warehouse Sprinkler Retrofit', 'Current', '2027-01-15', 'Available'),
(2, 'eq-2', 'Addressable Smoke Detector (SD-200)', 'Alarm Sensor', 48, 'Central Tower Alarm Upgrade', 'Current', '2026-11-20', 'Available'),
(3, 'eq-3', 'Flow Switch 4-inch (Model FS-40)', 'Hydraulic Valve', 6, 'Warehouse Sprinkler Retrofit', 'Inspection Due', '2026-10-28', 'Available'),
(4, 'eq-4', 'ABC Dry Chem Extinguisher 10lbs', 'Portable Extinguisher', 2, 'Plant Wide Protection', 'Current', '2026-12-05', 'Low Stock');

SELECT setval('inventory_items_id_seq', (SELECT MAX(id) FROM inventory_items));

-- Seed Payments
INSERT INTO payments (invoice_no, user_id, project_id, customer_name, amount, due_date, status, method_used, payment_reference) VALUES
('INV-2026-0811', 2, 1, 'Arden Manufacturing Ltd.', 48500.00, '2026-10-12', 'Partial', 'Bank Transfer', 'BDO-REF-992144'),
('INV-2026-0792', 2, 1, 'Arden Manufacturing Ltd.', 125000.00, '2026-09-15', 'Paid', 'Check Payment', 'CHK-MB-554109'),
('INV-2026-0744', 2, NULL, 'Arden Manufacturing Ltd.', 18200.00, '2026-08-30', 'Paid', 'GCash / Electronic', 'GC-8831092');

-- Seed Warranties
INSERT INTO warranties (warranty_code, user_id, project_id, customer_name, system_covered, install_date, expiry_date, status, coverage_summary) VALUES
('WAR-2025-0104', 2, 1, 'Arden Manufacturing Ltd.', 'Warehouse Sprinkler System (NFPA-13)', '2025-10-10', '2027-10-10', 'Active', 'Full parts and labor coverage for pipes, risers, and valves. 24-hour emergency technician dispatch included.'),
('WAR-2024-0822', 2, NULL, 'Arden Manufacturing Ltd.', 'Clean Agent FM-200 Server Room System', '2024-08-15', '2026-08-15', 'Active', 'Cylinder hydro-test, pressure check, actuator verification, and control panel diagnostics covered.'),
('WAR-2023-0419', 2, NULL, 'Arden Manufacturing Ltd.', 'Alarm Annunciator & Notification Strobe', '2023-04-10', '2025-04-10', 'Expired', 'Warranty period concluded. System eligible for Annual Maintenance Contract coverage renewal.');

-- Seed Maintenance Schedules
INSERT INTO maintenance_schedules (maintenance_code, user_id, project_id, customer_name, service_type, scheduled_date, status, technician, notes) VALUES
('MNT-2026-1014', 2, 1, 'Arden Manufacturing Ltd.', 'Quarterly Sprinkler Pressure & Flow Test', '2026-10-18', 'Due', 'M. Velasco', 'Inspection of main drain, dry valves, water flow alarms, and backflow preventers.'),
('MNT-2026-1102', 2, NULL, 'Arden Manufacturing Ltd.', 'Annual FM-200 Clean Agent Weight & Inspection', '2026-11-02', 'Scheduled', 'J. Ramos', 'Precision cylinder weighing and room integrity testing.'),
('MNT-2026-1215', 2, NULL, 'Arden Manufacturing Ltd.', 'Semi-Annual Fire Extinguisher Hydro & Tag', '2026-12-15', 'Scheduled', 'L. Santos', 'Plant-wide visual inspection, gauge pressure verification, and BFP stamp renewal.');

-- Seed Service History
INSERT INTO service_history (user_id, project_id, activity_type, title, description, service_date, badge, logged_by) VALUES
('2', 1, 'Inspection', 'Quarterly Riser Flow Test Passed', 'Technician executed main drain test on Riser 2. Static pressure at 115 PSI, residual pressure at 98 PSI. NFPA compliance confirmed.', '2026-09-12', 'Passed Audit', 'M. Velasco'),
('2', NULL, 'Repair', 'Replaced Flow Switch Sensor (FS-40)', 'Defective flow switch contact replaced in Warehouse Bay 2. Annunciator panel signal verified with control room.', '2026-08-20', 'Repaired & Cleared', 'A. Dela Cruz'),
('2', NULL, 'Maintenance', 'Extinguisher Annual Recertification', 'All 45 ABC portable units inspected, tagged, and registered under BFP Form 10.', '2026-06-05', 'BFP Tagged', 'L. Santos');

-- Seed Customer Messages
INSERT INTO customer_messages (user_id, title, description, is_read, created_at) VALUES
(2, 'Scheduled Technician Visit Confirmed', 'Engr. M. Velasco is scheduled for your Quarterly Sprinkler Pressure Test on Oct 18, 2026 at 09:00 AM.', false, '2026-10-03 08:30:00'),
(2, 'Payment Settlement Notice (INV-2026-0792)', 'Your check payment of ₱125,000.00 has been verified and settled in full.', true, '2026-09-16 11:20:00'),
(2, 'BFP Compliance Certificate Ready', 'Your annual inspection certificate for Fire Extinguisher compliance has been filed with BFP Local Station 4.', true, '2026-09-01 14:00:00');

-- Seed Admin Notifications
INSERT INTO admin_notifications (title, description, status, action_url) VALUES
('Critical Riser Valve Alert', 'Zone 4 main riser pressure alert flagged for Arden Manufacturing', 'Overdue', '#admin-service-requests'),
('New Service Request #REQ-2026-1048', 'Urgent Sprinkler Retrofit inquiry received from Engr. Alex Johnson', 'New', '#admin-inquiries'),
('Low Stock Threshold: ABC Extinguisher', 'Portable extinguisher inventory is down to 2 units', 'New', '#admin-inventory'),
('Payment Settlement Submitted', 'Arden Manufacturing posted partial transfer for INV-2026-0811', 'New', '#admin-payments');

-- Success confirmation
SELECT 'BD22 Supabase Database Schema & Seed Data imported successfully!' AS result;
