-- ========================================================
-- BD22 FIRE SYSTEM & BUILDERS INC.
-- Complete PostgreSQL Supabase Schema & Seed Data
-- ========================================================
-- This script configures the entire Supabase database to match
-- the BD22 web application (app.js, admin.js, customer.js, login.html, register.html).
--
-- Instructions:
-- 1. Open Supabase Dashboard -> SQL Editor
-- 2. Click "New query"
-- 3. Paste and run this entire script
-- ========================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. DROP EXISTING TABLES (in dependency order)
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
DROP TABLE IF EXISTS profiles CASCADE;

-- ========================================================
-- 2. CREATE CORE TABLES
-- ========================================================

-- Table: profiles (Linked directly to Supabase Auth auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  company TEXT DEFAULT 'Facility Operations',
  phone TEXT DEFAULT '',
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'staff')),
  pref_sms BOOLEAN NOT NULL DEFAULT true,
  pref_email BOOLEAN NOT NULL DEFAULT true,
  pref_warranty BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_email ON public.profiles(email);

-- Table: services (Catalog)
CREATE TABLE public.services (
  id BIGSERIAL PRIMARY KEY,
  slug VARCHAR(50) UNIQUE,
  service_code TEXT UNIQUE,
  title VARCHAR(150) NOT NULL,
  name TEXT,
  category TEXT,
  overview TEXT,
  short_description TEXT,
  description TEXT,
  full_description TEXT,
  standards JSONB,
  nfpa_standards TEXT,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: inquiries
CREATE TABLE public.inquiries (
  id BIGSERIAL PRIMARY KEY,
  reference_no VARCHAR(50) UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  submission_source TEXT NOT NULL DEFAULT 'legacy_unknown'
    CHECK (submission_source IN (
      'public_visitor',
      'customer_account_verified',
      'customer_account_unverified',
      'signed_in_non_customer',
      'legacy_unknown'
    )),
  customer_name VARCHAR(150) NOT NULL,
  email VARCHAR(191) NOT NULL,
  phone VARCHAR(50),
  service_name VARCHAR(150) NOT NULL,
  message TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'Pending Review' CHECK (status IN ('Pending Review', 'Under Review', 'Scheduled', 'In Progress', 'Completed', 'Cancelled')),
  assigned_staff VARCHAR(100) NOT NULL DEFAULT 'Unassigned',
  tracking_note TEXT,
  last_update TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_inq_status ON public.inquiries(status);
CREATE INDEX idx_inq_ref ON public.inquiries(reference_no);
CREATE INDEX idx_inq_email ON public.inquiries(email);
CREATE INDEX idx_inq_user ON public.inquiries(user_id);
CREATE INDEX idx_inquiries_auth_user ON public.inquiries(auth_user_id);

-- Table: service_requests (Includes full assessment & booking fields)
CREATE TABLE public.service_requests (
  id BIGSERIAL PRIMARY KEY,
  reference_no VARCHAR(50) UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name VARCHAR(150) NOT NULL,
  service_type VARCHAR(150) NOT NULL,
  urgency VARCHAR(50) NOT NULL DEFAULT 'Standard' CHECK (urgency IN ('Standard', 'Urgent', 'Emergency / Urgent', 'Standard Maintenance', 'Priority', 'Scheduled')),
  notes TEXT,
  description TEXT,
  preferred_timeline TEXT,
  preferred_date DATE,
  establishment_name TEXT,
  building_type TEXT,
  floors TEXT,
  site_address TEXT,
  google_maps_link TEXT,
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  contact_position TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  additional_concerns TEXT,
  quotation_amount NUMERIC(12,2) DEFAULT 0.00,
  scheduled_date DATE,
  assessment_notes TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'Pending Review' CHECK (status IN (
    'Pending Review', 'Under Assessment', 'Quotation Prepared', 'Approved', 
    'Rejected', 'Scheduled', 'In Progress', 'Completed', 'Cancelled', 'Urgent'
  )),
  assigned_staff VARCHAR(100) NOT NULL DEFAULT 'Unassigned',
  last_update TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sr_user ON public.service_requests(user_id);
CREATE INDEX idx_sr_status ON public.service_requests(status);
CREATE INDEX idx_sr_ref ON public.service_requests(reference_no);

-- Table: projects (Includes project management, billing & warranty columns)
CREATE TABLE public.projects (
  id BIGSERIAL PRIMARY KEY,
  project_code VARCHAR(50) UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name VARCHAR(150) NOT NULL,
  customer_name VARCHAR(150) NOT NULL,
  assigned_team VARCHAR(100) NOT NULL DEFAULT 'Team Alpha (Operations)',
  progress INT NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  start_date DATE DEFAULT CURRENT_DATE,
  target_date DATE,
  actual_completion_date DATE,
  status VARCHAR(50) NOT NULL DEFAULT 'In Progress' CHECK (status IN ('Not Started', 'In Progress', 'On Hold', 'Completed', 'Planning', 'Scheduled')),
  priority TEXT DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent', 'Standard')),
  project_manager TEXT DEFAULT 'Lead Project Engineer',
  budget NUMERIC(12,2) DEFAULT 0.00,
  agreed_cost NUMERIC(12,2) DEFAULT 0.00,
  scope_of_work TEXT,
  milestones TEXT,
  tasks JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  description TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  warranty_start_date DATE,
  warranty_end_date DATE,
  warranty_status TEXT,
  maintenance_details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_proj_status ON public.projects(status);
CREATE INDEX idx_proj_user ON public.projects(user_id);
CREATE INDEX idx_proj_code ON public.projects(project_code);

-- Table: inventory_items
CREATE TABLE public.inventory_items (
  id BIGSERIAL PRIMARY KEY,
  item_code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  item_type VARCHAR(100) NOT NULL,
  quantity INT NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  min_reorder_level INT NOT NULL DEFAULT 2,
  customer_project VARCHAR(150) DEFAULT 'General Stock',
  service_status VARCHAR(50) NOT NULL DEFAULT 'Current',
  next_maintenance DATE,
  stock_status VARCHAR(50) NOT NULL DEFAULT 'Available' CHECK (stock_status IN ('Available', 'Low Stock', 'Out of Stock')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_inv_code ON public.inventory_items(item_code);
CREATE INDEX idx_inv_stock ON public.inventory_items(stock_status);

-- Table: project_equipment
CREATE TABLE public.project_equipment (
  id BIGSERIAL PRIMARY KEY,
  project_id BIGINT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  inventory_id BIGINT NOT NULL REFERENCES public.inventory_items(id) ON DELETE RESTRICT,
  allocated_qty INT NOT NULL DEFAULT 1,
  allocated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: payments (Billing & Client Invoices)
CREATE TABLE public.payments (
  id BIGSERIAL PRIMARY KEY,
  invoice_no VARCHAR(50) NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  project_id BIGINT REFERENCES public.projects(id) ON DELETE SET NULL,
  customer_name VARCHAR(150) NOT NULL,
  project_name TEXT,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  amount_paid NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  balance NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  due_date DATE,
  invoice_date DATE DEFAULT CURRENT_DATE,
  status VARCHAR(50) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Paid', 'Partial', 'Unpaid', 'Pending', 'Overdue')),
  method_used VARCHAR(50),
  payment_reference VARCHAR(100),
  payment_history JSONB DEFAULT '[]'::jsonb,
  billing_notes TEXT,
  last_update TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pay_user ON public.payments(user_id);
CREATE INDEX idx_pay_proj ON public.payments(project_id);
CREATE INDEX idx_pay_status ON public.payments(status);
CREATE INDEX idx_pay_inv ON public.payments(invoice_no);

-- Table: warranties
CREATE TABLE public.warranties (
  id BIGSERIAL PRIMARY KEY,
  warranty_code VARCHAR(50) NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  project_id BIGINT REFERENCES public.projects(id) ON DELETE SET NULL,
  customer_name VARCHAR(150) NOT NULL,
  system_covered VARCHAR(150) NOT NULL,
  install_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Expiring Soon', 'Expired')),
  coverage_summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_warr_user ON public.warranties(user_id);
CREATE INDEX idx_warr_status ON public.warranties(status);

-- Table: maintenance_schedules
CREATE TABLE public.maintenance_schedules (
  id BIGSERIAL PRIMARY KEY,
  maintenance_code VARCHAR(50) NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  project_id BIGINT REFERENCES public.projects(id) ON DELETE SET NULL,
  customer_name VARCHAR(150) NOT NULL,
  service_type VARCHAR(150) NOT NULL,
  scheduled_date DATE NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'Scheduled' CHECK (status IN ('Due', 'Scheduled', 'Overdue', 'Upcoming', 'Completed')),
  technician VARCHAR(100) NOT NULL DEFAULT 'Unassigned',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_maint_user ON public.maintenance_schedules(user_id);
CREATE INDEX idx_maint_status ON public.maintenance_schedules(status);

-- Table: service_history
CREATE TABLE public.service_history (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  project_id BIGINT REFERENCES public.projects(id) ON DELETE SET NULL,
  activity_type VARCHAR(100) NOT NULL DEFAULT 'Routine Service',
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  service_date DATE NOT NULL DEFAULT CURRENT_DATE,
  badge VARCHAR(50) NOT NULL DEFAULT 'Routine Service',
  logged_by VARCHAR(100) NOT NULL DEFAULT 'System',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_hist_user ON public.service_history(user_id);

-- Table: customer_messages
CREATE TABLE public.customer_messages (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_msg_user ON public.customer_messages(user_id);

-- Table: admin_notifications
CREATE TABLE public.admin_notifications (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'New' CHECK (status IN ('New', 'Overdue', 'Read', 'Resolved', 'Archived')),
  action_url VARCHAR(255) NOT NULL DEFAULT '#',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notif_status ON public.admin_notifications(status);

-- ========================================================
-- 3. FUNCTIONS & TRIGGERS
-- ========================================================

-- Helper Security Function: Check if caller is Administrator
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.profiles AS p
        WHERE p.id = (SELECT auth.uid())
          AND p.role = 'admin'
    );
$$;

-- Trigger Function: Auto-create or update profile when a user signs up via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_full_name TEXT;
    v_company TEXT;
    v_phone TEXT;
    v_role TEXT;
BEGIN
    v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1));
    v_company := COALESCE(NEW.raw_user_meta_data->>'company', 'Facility Operations');
    v_phone := COALESCE(NEW.raw_user_meta_data->>'phone', '');
    v_role := COALESCE(NEW.raw_user_meta_data->>'role', CASE WHEN lower(NEW.email) = 'admin@bd22fire.com' THEN 'admin' ELSE 'customer' END);

    IF lower(NEW.email) = 'admin@bd22fire.com' THEN
        v_role := 'admin';
    END IF;

    INSERT INTO public.profiles (id, email, full_name, company, phone, role)
    VALUES (NEW.id, NEW.email, v_full_name, v_company, v_phone, v_role)
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        company = EXCLUDED.company,
        phone = EXCLUDED.phone,
        role = CASE WHEN lower(EXCLUDED.email) = 'admin@bd22fire.com' THEN 'admin' ELSE public.profiles.role END,
        updated_at = NOW();

    IF v_role = 'customer' THEN
        INSERT INTO public.customer_messages (user_id, title, description)
        VALUES (NEW.id, 'Welcome to BD22 Fire System Portal', 'Your account is active. You can now request fire protection services, review project milestones, monitor warranties, and track BFP compliance audits.');
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger: Generate Inquiry Reference (INQ-YYYY-NNNN)
CREATE OR REPLACE FUNCTION public.fn_generate_inquiry_reference()
RETURNS TRIGGER AS $$
DECLARE
    v_year TEXT;
    v_seq INT;
BEGIN
    IF NEW.reference_no IS NULL OR TRIM(NEW.reference_no) = '' THEN
        v_year := TO_CHAR(NOW(), 'YYYY');
        SELECT COUNT(*) + 1 INTO v_seq FROM public.inquiries WHERE reference_no LIKE 'INQ-' || v_year || '-%';
        LOOP
            NEW.reference_no := 'INQ-' || v_year || '-' || LPAD(v_seq::TEXT, 4, '0');
            EXIT WHEN NOT EXISTS (SELECT 1 FROM public.inquiries WHERE reference_no = NEW.reference_no);
            v_seq := v_seq + 1;
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_inquiry_ref ON public.inquiries;
CREATE TRIGGER trg_inquiry_ref
    BEFORE INSERT ON public.inquiries
    FOR EACH ROW EXECUTE FUNCTION public.fn_generate_inquiry_reference();

-- Trigger: Generate Service Request Reference (BD22-REQ-YYYY-NNN)
CREATE OR REPLACE FUNCTION public.fn_generate_service_req_reference()
RETURNS TRIGGER AS $$
DECLARE
    v_year TEXT;
    v_seq INT;
BEGIN
    IF NEW.reference_no IS NULL OR TRIM(NEW.reference_no) = '' THEN
        v_year := TO_CHAR(NOW(), 'YYYY');
        SELECT COUNT(*) + 1 INTO v_seq 
        FROM public.service_requests 
        WHERE reference_no LIKE 'BD22-REQ-' || v_year || '-%' OR reference_no LIKE 'REQ-' || v_year || '-%';
        
        LOOP
            NEW.reference_no := 'BD22-REQ-' || v_year || '-' || LPAD(v_seq::TEXT, 3, '0');
            EXIT WHEN NOT EXISTS (SELECT 1 FROM public.service_requests WHERE reference_no = NEW.reference_no);
            v_seq := v_seq + 1;
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_service_req_ref ON public.service_requests;
CREATE TRIGGER trg_service_req_ref
    BEFORE INSERT ON public.service_requests
    FOR EACH ROW EXECUTE FUNCTION public.fn_generate_service_req_reference();

-- Trigger: Generate Project Code (BD22-PRJ-YYYY-NNN)
CREATE OR REPLACE FUNCTION public.fn_generate_project_code()
RETURNS TRIGGER AS $$
DECLARE
    v_year TEXT;
    v_seq INT;
BEGIN
    IF NEW.project_code IS NULL OR TRIM(NEW.project_code) = '' OR NEW.project_code LIKE 'proj-%' THEN
        v_year := TO_CHAR(NOW(), 'YYYY');
        SELECT COUNT(*) + 1 INTO v_seq FROM public.projects WHERE project_code LIKE 'BD22-PRJ-' || v_year || '-%';
        LOOP
            NEW.project_code := 'BD22-PRJ-' || v_year || '-' || LPAD(v_seq::TEXT, 3, '0');
            EXIT WHEN NOT EXISTS (SELECT 1 FROM public.projects WHERE project_code = NEW.project_code);
            v_seq := v_seq + 1;
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_project_code ON public.projects;
CREATE TRIGGER trg_project_code
    BEFORE INSERT ON public.projects
    FOR EACH ROW EXECUTE FUNCTION public.fn_generate_project_code();

-- Trigger: Generate Maintenance Code (BD22-MNT-YYYY-NNN)
CREATE OR REPLACE FUNCTION public.fn_generate_maintenance_code()
RETURNS TRIGGER AS $$
DECLARE
    v_year TEXT;
    v_seq INT;
BEGIN
    IF NEW.maintenance_code IS NULL OR TRIM(NEW.maintenance_code) = '' THEN
        v_year := TO_CHAR(NOW(), 'YYYY');
        SELECT COUNT(*) + 1 INTO v_seq 
        FROM public.maintenance_schedules 
        WHERE maintenance_code LIKE 'BD22-MNT-' || v_year || '-%' OR maintenance_code LIKE 'MNT-' || v_year || '-%';
        LOOP
            NEW.maintenance_code := 'BD22-MNT-' || v_year || '-' || LPAD(v_seq::TEXT, 3, '0');
            EXIT WHEN NOT EXISTS (SELECT 1 FROM public.maintenance_schedules WHERE maintenance_code = NEW.maintenance_code);
            v_seq := v_seq + 1;
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_maintenance_code ON public.maintenance_schedules;
CREATE TRIGGER trg_maintenance_code
    BEFORE INSERT ON public.maintenance_schedules
    FOR EACH ROW EXECUTE FUNCTION public.fn_generate_maintenance_code();

-- Automation Trigger: Notify admin on inquiry
CREATE OR REPLACE FUNCTION public.fn_notify_admin_on_inquiry()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.admin_notifications (title, description, status, action_url)
    VALUES (
        'New Inquiry: ' || NEW.customer_name || ' (' || COALESCE(NEW.reference_no, 'New') || ')',
        'Service: ' || NEW.service_name || COALESCE(' • Phone: ' || NEW.phone, ''),
        'New',
        'admin.html#admin-inquiries'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notify_inquiry ON public.inquiries;
CREATE TRIGGER trg_notify_inquiry
    AFTER INSERT ON public.inquiries
    FOR EACH ROW EXECUTE FUNCTION public.fn_notify_admin_on_inquiry();

-- Automation Trigger: Notify admin on service request
CREATE OR REPLACE FUNCTION public.fn_notify_admin_on_service_request()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.admin_notifications (title, description, status, action_url)
    VALUES (
        'Service Request: ' || COALESCE(NEW.establishment_name, NEW.customer_name) || ' (' || COALESCE(NEW.reference_no, 'New') || ')',
        'Service: ' || NEW.service_type || ' • Urgency: ' || NEW.urgency,
        'New',
        'admin.html#admin-service-requests'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notify_service_req ON public.service_requests;
CREATE TRIGGER trg_notify_service_req
    AFTER INSERT ON public.service_requests
    FOR EACH ROW EXECUTE FUNCTION public.fn_notify_admin_on_service_request();

-- Automation Trigger: When project completed, auto-log service history & notify customer
CREATE OR REPLACE FUNCTION public.fn_project_completion_automation()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'Completed' AND (OLD.status IS DISTINCT FROM 'Completed') THEN
        IF NEW.user_id IS NOT NULL THEN
            INSERT INTO public.service_history (user_id, project_id, activity_type, title, description, service_date, badge, logged_by)
            VALUES (
                NEW.user_id,
                NEW.id,
                'Project Turnover',
                'Project Commissioning & Turnover: ' || NEW.name,
                'Fire protection system installation, pressure testing, and operational turnover completed.',
                CURRENT_DATE,
                'Completed',
                COALESCE(NEW.project_manager, 'Engineering Operations')
            );

            INSERT INTO public.customer_messages (user_id, title, description, is_read)
            VALUES (
                NEW.user_id,
                'Project Turnover Complete: ' || NEW.name,
                'Your installation has reached 100% completion. BFP certification and system turnover documentation are ready.',
                false
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_project_completion ON public.projects;
CREATE TRIGGER trg_project_completion
    AFTER UPDATE ON public.projects
    FOR EACH ROW EXECUTE FUNCTION public.fn_project_completion_automation();

-- Automation Trigger: When maintenance completed, auto-log service history
CREATE OR REPLACE FUNCTION public.fn_maintenance_completion_automation()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'Completed' AND (OLD.status IS DISTINCT FROM 'Completed') THEN
        IF NEW.user_id IS NOT NULL THEN
            INSERT INTO public.service_history (user_id, project_id, activity_type, title, description, service_date, badge, logged_by)
            VALUES (
                NEW.user_id,
                NEW.project_id,
                'Routine Service',
                'Preventative Service Completed: ' || NEW.service_type,
                COALESCE(NEW.notes, 'Routine system maintenance and functional inspection completed.'),
                CURRENT_DATE,
                'Verified',
                COALESCE(NEW.technician, 'Service Technician')
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_maintenance_completion ON public.maintenance_schedules;
CREATE TRIGGER trg_maintenance_completion
    AFTER UPDATE ON public.maintenance_schedules
    FOR EACH ROW EXECUTE FUNCTION public.fn_maintenance_completion_automation();

-- Public RPC: Universal inquiry submission endpoint (matches app.js:857 rpc('submit_public_inquiry'))
CREATE OR REPLACE FUNCTION public.submit_public_inquiry(
    customer_name TEXT,
    email TEXT,
    phone TEXT DEFAULT '',
    service_name TEXT DEFAULT 'General Inquiry',
    message TEXT DEFAULT ''
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_inq RECORD;
    v_user_id UUID;
    v_email_verified BOOLEAN;
    v_submission_source TEXT;
BEGIN
    -- Rate limit: reject if more than 5 inquiries from this email within the last 15 minutes
    IF (SELECT COUNT(*) FROM public.inquiries WHERE LOWER(inquiries.email) = LOWER(submit_public_inquiry.email) AND created_at > NOW() - INTERVAL '15 minutes') >= 5 THEN
        RAISE EXCEPTION 'Rate limit exceeded: Too many inquiries submitted from this address. Please try again later.'
            USING ERRCODE = 'P0001';
    END IF;

    IF auth.uid() IS NULL THEN
        v_submission_source := 'public_visitor';
    ELSE
        SELECT p.id, u.email_confirmed_at IS NOT NULL
        INTO v_user_id, v_email_verified
        FROM public.profiles p
        JOIN auth.users u ON u.id = p.id
        WHERE p.id = auth.uid()
          AND p.role = 'customer';

        IF v_user_id IS NULL THEN
            v_submission_source := 'signed_in_non_customer';
        ELSIF v_email_verified THEN
            v_submission_source := 'customer_account_verified';
        ELSE
            v_submission_source := 'customer_account_unverified';
        END IF;
    END IF;

    INSERT INTO public.inquiries (
        auth_user_id,
        submission_source,
        customer_name,
        email,
        phone,
        service_name,
        message,
        status
    )
    VALUES (
        v_user_id,
        v_submission_source,
        customer_name,
        email,
        phone,
        service_name,
        message,
        'Pending Review'
    )
    RETURNING * INTO v_inq;

    RETURN jsonb_build_object(
        'id', v_inq.id,
        'reference_no', v_inq.reference_no,
        'auth_user_id', v_inq.auth_user_id,
        'submission_source', v_inq.submission_source,
        'customer_name', v_inq.customer_name,
        'status', v_inq.status
    );
END;
$$;

-- ========================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warranties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- Clean existing policies
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.' || quote_ident(r.tablename);
    END LOOP;
END $$;

-- Policies: profiles
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id OR public.is_admin()) WITH CHECK (auth.uid() = id OR public.is_admin());
CREATE POLICY "Admins manage profiles" ON public.profiles FOR ALL USING (public.is_admin());

-- Policies: services
CREATE POLICY "Public view services" ON public.services FOR SELECT USING (is_active = true OR public.is_admin());
CREATE POLICY "Admins manage services" ON public.services FOR ALL USING (public.is_admin());

-- Policies: inquiries
CREATE POLICY "Anyone can submit inquiry" ON public.inquiries FOR INSERT WITH CHECK (auth_user_id IS NULL OR auth.uid() = auth_user_id);
CREATE POLICY "Users view own inquiries" ON public.inquiries FOR SELECT USING (auth.uid() = auth_user_id OR public.is_admin());
CREATE POLICY "Admins manage inquiries" ON public.inquiries FOR ALL USING (public.is_admin());

-- Policies: service_requests
CREATE POLICY "Users submit service requests" ON public.service_requests FOR INSERT WITH CHECK (auth.uid() = user_id OR (user_id IS NULL AND auth.uid() IS NULL) OR public.is_admin());
CREATE POLICY "Users view own service requests" ON public.service_requests FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Admins manage service requests" ON public.service_requests FOR ALL USING (public.is_admin());

-- Policies: projects
CREATE POLICY "Users view own projects" ON public.projects FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Admins manage projects" ON public.projects FOR ALL USING (public.is_admin());

-- Policies: inventory_items
CREATE POLICY "Authenticated view active inventory" ON public.inventory_items FOR SELECT TO authenticated USING (is_active = true OR public.is_admin());
CREATE POLICY "Admins manage inventory" ON public.inventory_items FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Policies: project_equipment
CREATE POLICY "Users view project equipment" ON public.project_equipment FOR SELECT TO authenticated USING (public.is_admin() OR EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_equipment.project_id AND p.user_id = auth.uid()));
CREATE POLICY "Admins manage project equipment" ON public.project_equipment FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Policies: payments
CREATE POLICY "Users view own payments" ON public.payments FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Users submit payment confirmation" ON public.payments FOR UPDATE USING (auth.uid() = user_id OR public.is_admin()) WITH CHECK (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Admins manage payments" ON public.payments FOR ALL USING (public.is_admin());

-- Policies: warranties
CREATE POLICY "Users view own warranties" ON public.warranties FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Admins manage warranties" ON public.warranties FOR ALL USING (public.is_admin());

-- Policies: maintenance_schedules
CREATE POLICY "Users view own maintenance" ON public.maintenance_schedules FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Users request maintenance" ON public.maintenance_schedules FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Admins manage maintenance" ON public.maintenance_schedules FOR ALL USING (public.is_admin());

-- Policies: service_history
CREATE POLICY "Users view own service history" ON public.service_history FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Admins manage service history" ON public.service_history FOR ALL USING (public.is_admin());

-- Policies: customer_messages
CREATE POLICY "Users view own messages" ON public.customer_messages FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Users update own messages" ON public.customer_messages FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Admins manage customer messages" ON public.customer_messages FOR ALL USING (public.is_admin());

-- Policies: admin_notifications
CREATE POLICY "System inserts notifications" ON public.admin_notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins manage notifications" ON public.admin_notifications FOR ALL USING (public.is_admin());

-- ========================================================
-- 4.1 SECURE FILE STORAGE & POLICIES
-- ========================================================
-- Ensure private storage bucket exists for customer service attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'service-attachments',
    'service-attachments',
    false, -- Private bucket: access strictly requires expiring signed URLs
    10485760, -- 10 MB maximum upload size
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'application/zip']
)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Clean existing storage policies
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users upload own service attachments" ON storage.objects;
    DROP POLICY IF EXISTS "Users view own service attachments" ON storage.objects;
    DROP POLICY IF EXISTS "Admins manage all service attachments" ON storage.objects;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Storage Policies: Users can only upload and read files within their own user-id folder
CREATE POLICY "Users upload own service attachments" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'service-attachments' 
    AND (auth.uid())::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users view own service attachments" ON storage.objects
FOR SELECT TO authenticated
USING (
    bucket_id = 'service-attachments'
    AND ((auth.uid())::text = (storage.foldername(name))[1] OR public.is_admin())
);

CREATE POLICY "Admins manage all service attachments" ON storage.objects
FOR ALL TO authenticated
USING (
    bucket_id = 'service-attachments' AND public.is_admin()
)
WITH CHECK (
    bucket_id = 'service-attachments' AND public.is_admin()
);

-- Permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_public_inquiry TO anon, authenticated;

-- ========================================================
-- 5. ACCOUNT RECONCILIATION (No sample data seeded)
-- ========================================================

-- Sync any existing accounts from auth.users into public.profiles
INSERT INTO public.profiles (id, email, full_name, company, phone, role)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', split_part(email, '@', 1)),
    COALESCE(raw_user_meta_data->>'company', 'Facility Operations'),
    COALESCE(raw_user_meta_data->>'phone', ''),
    COALESCE(raw_user_meta_data->>'role', CASE WHEN lower(email) = 'admin@bd22fire.com' THEN 'admin' ELSE 'customer' END)
FROM auth.users
ON CONFLICT (id) DO UPDATE
SET email = EXCLUDED.email,
    role = CASE WHEN lower(EXCLUDED.email) = 'admin@bd22fire.com' THEN 'admin' ELSE public.profiles.role END;

-- Promote admin account to admin role if it already exists
UPDATE public.profiles
SET role = 'admin', updated_at = NOW()
WHERE lower(email) = lower('admin@bd22fire.com');

-- Reload PostgREST schema cache so all tables and columns are immediately accessible via the API
NOTIFY pgrst, 'reload schema';

-- Success confirmation
SELECT 'BD22 Supabase Database Schema imported successfully! All business tables are empty and ready.' AS result;
