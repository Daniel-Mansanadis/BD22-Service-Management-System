-- ============================================================================
-- BD22 FIRE SYSTEM & BUILDERS INC.
-- Comprehensive Supabase Cloud PostgreSQL Migration & RLS Security Schema
-- ============================================================================

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 2. Create / Reconcile Profiles Table linked to Supabase auth.users
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    company TEXT,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'staff')),
    pref_sms BOOLEAN DEFAULT TRUE,
    pref_email BOOLEAN DEFAULT TRUE,
    pref_warranty BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Helper Security Function: Check if caller is Administrator
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Trigger: Automatically create public.profiles upon auth.users signup
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
    v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'customer');

    -- Insert into profiles
    INSERT INTO public.profiles (id, email, full_name, company, phone, role)
    VALUES (NEW.id, NEW.email, v_full_name, v_company, v_phone, v_role)
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        company = EXCLUDED.company,
        phone = EXCLUDED.phone,
        role = EXCLUDED.role,
        updated_at = NOW();

    -- Insert welcome message for customer
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

-- ============================================================================
-- 3. Core Business Tables (Linked via user_id UUID)
-- ============================================================================

-- A. Inquiries
CREATE TABLE IF NOT EXISTS public.inquiries (
    id BIGSERIAL PRIMARY KEY,
    reference_no TEXT UNIQUE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    service_name TEXT NOT NULL,
    message TEXT,
    status TEXT NOT NULL DEFAULT 'Pending Review' CHECK (status IN ('Pending Review', 'Under Review', 'Scheduled', 'In Progress', 'Completed', 'Cancelled')),
    assigned_staff TEXT DEFAULT 'Unassigned',
    tracking_note TEXT DEFAULT 'Inquiry logged into system and queued for engineering review.',
    last_update TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- B. Service Requests
CREATE TABLE IF NOT EXISTS public.service_requests (
    id BIGSERIAL PRIMARY KEY,
    reference_no TEXT UNIQUE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    service_type TEXT NOT NULL,
    urgency TEXT NOT NULL DEFAULT 'Standard' CHECK (urgency IN ('Standard', 'Urgent', 'Emergency / Urgent', 'Scheduled')),
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'Pending Review' CHECK (status IN ('Pending Review', 'Scheduled', 'In Progress', 'Completed', 'Cancelled')),
    assigned_staff TEXT DEFAULT 'Unassigned',
    last_update TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- C. Projects
CREATE TABLE IF NOT EXISTS public.projects (
    id BIGSERIAL PRIMARY KEY,
    project_code TEXT UNIQUE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    assigned_team TEXT DEFAULT 'Ramos Fire Systems',
    progress INT NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    target_date DATE,
    status TEXT NOT NULL DEFAULT 'In Progress' CHECK (status IN ('Planning', 'In Progress', 'Scheduled', 'On Hold', 'Completed')),
    milestones TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- D. Inventory Items
CREATE TABLE IF NOT EXISTS public.inventory_items (
    id BIGSERIAL PRIMARY KEY,
    item_code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    item_type TEXT NOT NULL,
    quantity INT NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    min_reorder_level INT NOT NULL DEFAULT 2,
    customer_project TEXT,
    service_status TEXT DEFAULT 'Current',
    next_maintenance DATE,
    stock_status TEXT DEFAULT 'Available',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- E. Payments & Invoices
CREATE TABLE IF NOT EXISTS public.payments (
    id BIGSERIAL PRIMARY KEY,
    invoice_no TEXT UNIQUE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    project_id BIGINT REFERENCES public.projects(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    project_name TEXT,
    amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    due_date DATE,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Partial', 'Overdue', 'Paid')),
    method_used TEXT,
    payment_reference TEXT,
    last_update TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- F. Warranties
CREATE TABLE IF NOT EXISTS public.warranties (
    id BIGSERIAL PRIMARY KEY,
    warranty_code TEXT UNIQUE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    project_id BIGINT REFERENCES public.projects(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    system_covered TEXT NOT NULL,
    install_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Expiring Soon', 'Expired')),
    coverage_summary TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- G. Maintenance Schedules
CREATE TABLE IF NOT EXISTS public.maintenance_schedules (
    id BIGSERIAL PRIMARY KEY,
    maintenance_code TEXT UNIQUE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    project_id BIGINT REFERENCES public.projects(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    service_type TEXT NOT NULL,
    scheduled_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'Due', 'Overdue', 'Upcoming', 'Completed')),
    technician TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- H. Certified Service History
CREATE TABLE IF NOT EXISTS public.service_history (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    project_id BIGINT REFERENCES public.projects(id) ON DELETE SET NULL,
    activity_type TEXT NOT NULL DEFAULT 'Maintenance',
    title TEXT NOT NULL,
    description TEXT,
    service_date DATE NOT NULL DEFAULT CURRENT_DATE,
    badge TEXT DEFAULT 'Verified',
    logged_by TEXT DEFAULT 'Senior Inspector',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- I. Customer Messages
CREATE TABLE IF NOT EXISTS public.customer_messages (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- J. Admin Notifications
CREATE TABLE IF NOT EXISTS public.admin_notifications (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'New' CHECK (status IN ('New', 'Overdue', 'Resolved')),
    action_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- K. Services Catalog
CREATE TABLE IF NOT EXISTS public.services (
    id BIGSERIAL PRIMARY KEY,
    service_code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category TEXT,
    short_description TEXT,
    full_description TEXT,
    nfpa_standards TEXT,
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 4. Automatic Reference Sequence Generators (Collision-Free)
-- ============================================================================

-- Inquiry Reference Trigger (INQ-YYYY-NNNN)
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

-- Service Request Reference Trigger (REQ-YYYY-NNNN)
CREATE OR REPLACE FUNCTION public.fn_generate_service_req_reference()
RETURNS TRIGGER AS $$
DECLARE
    v_year TEXT;
    v_seq INT;
BEGIN
    IF NEW.reference_no IS NULL OR TRIM(NEW.reference_no) = '' THEN
        v_year := TO_CHAR(NOW(), 'YYYY');
        SELECT COUNT(*) + 1 INTO v_seq FROM public.service_requests WHERE reference_no LIKE 'REQ-' || v_year || '-%';
        LOOP
            NEW.reference_no := 'REQ-' || v_year || '-' || LPAD(v_seq::TEXT, 4, '0');
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

-- Project Code Trigger (proj-N)
CREATE OR REPLACE FUNCTION public.fn_generate_project_code()
RETURNS TRIGGER AS $$
DECLARE
    v_seq INT;
BEGIN
    IF NEW.project_code IS NULL OR TRIM(NEW.project_code) = '' THEN
        SELECT COUNT(*) + 1 INTO v_seq FROM public.projects;
        LOOP
            NEW.project_code := 'proj-' || v_seq;
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

-- Maintenance Code Trigger (MNT-YYYY-NNNN)
CREATE OR REPLACE FUNCTION public.fn_generate_maintenance_code()
RETURNS TRIGGER AS $$
DECLARE
    v_year TEXT;
    v_seq INT;
BEGIN
    IF NEW.maintenance_code IS NULL OR TRIM(NEW.maintenance_code) = '' THEN
        v_year := TO_CHAR(NOW(), 'YYYY');
        SELECT COUNT(*) + 1 INTO v_seq FROM public.maintenance_schedules WHERE maintenance_code LIKE 'MNT-' || v_year || '-%';
        LOOP
            NEW.maintenance_code := 'MNT-' || v_year || '-' || LPAD(v_seq::TEXT, 4, '0');
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

-- ============================================================================
-- 5. Business Event Automation Triggers
-- ============================================================================

-- Trigger: Notify admin when an inquiry is created
CREATE OR REPLACE FUNCTION public.fn_notify_admin_on_inquiry()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.admin_notifications (title, description, status, action_url)
    VALUES (
        'New Inquiry: ' || NEW.customer_name || ' (' || NEW.reference_no || ')',
        'Service requested: ' || NEW.service_name || COALESCE(' • Phone: ' || NEW.phone, ''),
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

-- Trigger: Notify admin when service request is logged
CREATE OR REPLACE FUNCTION public.fn_notify_admin_on_service_request()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.admin_notifications (title, description, status, action_url)
    VALUES (
        'Service Request: ' || NEW.customer_name || ' (' || NEW.reference_no || ')',
        'Urgency: ' || NEW.urgency || ' • Type: ' || NEW.service_type,
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

-- Trigger: When project completed, auto-log service history & notify customer
CREATE OR REPLACE FUNCTION public.fn_project_completion_automation()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'Completed' AND (OLD.status IS DISTINCT FROM 'Completed') THEN
        IF NEW.user_id IS NOT NULL THEN
            -- Record in service history
            INSERT INTO public.service_history (user_id, project_id, activity_type, title, description, service_date, badge, logged_by)
            VALUES (
                NEW.user_id,
                NEW.id,
                'Installation',
                'Project Completed: ' || NEW.name,
                'Full installation and commissioning passed BFP inspection standards.',
                CURRENT_DATE,
                'Project Turnover',
                'Engineering Operations'
            );

            -- Notify customer
            INSERT INTO public.customer_messages (user_id, title, description, is_read)
            VALUES (
                NEW.user_id,
                'Project Turnover Complete: ' || NEW.name,
                'Your installation has reached 100% completion. BFP certification and system warranty are now active.',
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

-- Trigger: When maintenance completed, auto-log service history
CREATE OR REPLACE FUNCTION public.fn_maintenance_completion_automation()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'Completed' AND (OLD.status IS DISTINCT FROM 'Completed') THEN
        IF NEW.user_id IS NOT NULL THEN
            INSERT INTO public.service_history (user_id, project_id, activity_type, title, description, service_date, badge, logged_by)
            VALUES (
                NEW.user_id,
                NEW.project_id,
                'Maintenance',
                'Preventative Service Completed: ' || NEW.service_type,
                COALESCE(NEW.notes, 'Routine system maintenance and functional inspection completed.'),
                CURRENT_DATE,
                'Certified',
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

-- ============================================================================
-- 6. Row Level Security (RLS) Configuration
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warranties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to allow clean idempotent re-application
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.' || quote_ident(r.tablename);
    END LOOP;
END $$;

-- Policies for public.profiles
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id OR public.is_admin()) WITH CHECK (auth.uid() = id OR public.is_admin());
CREATE POLICY "Admins can manage all profiles" ON public.profiles FOR ALL USING (public.is_admin());

-- Policies for public.inquiries
-- Public visitors and authenticated users can insert inquiries
CREATE POLICY "Anyone can submit inquiry" ON public.inquiries FOR INSERT WITH CHECK (true);
CREATE POLICY "Customers view own inquiries" ON public.inquiries FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Admins update inquiries" ON public.inquiries FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins delete inquiries" ON public.inquiries FOR DELETE USING (public.is_admin());

-- Policies for public.service_requests
CREATE POLICY "Authenticated users submit service requests" ON public.service_requests FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Customers view own service requests" ON public.service_requests FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Admins update service requests" ON public.service_requests FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins delete service requests" ON public.service_requests FOR DELETE USING (public.is_admin());

-- Policies for public.projects
CREATE POLICY "Customers view own projects" ON public.projects FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Admins manage projects" ON public.projects FOR ALL USING (public.is_admin());

-- Policies for public.inventory_items
CREATE POLICY "Admins manage inventory" ON public.inventory_items FOR ALL USING (public.is_admin());
CREATE POLICY "Customers view project inventory" ON public.inventory_items FOR SELECT USING (true);

-- Policies for public.payments
CREATE POLICY "Customers view own payments" ON public.payments FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Customers can record payment confirmation" ON public.payments FOR UPDATE USING (auth.uid() = user_id OR public.is_admin()) WITH CHECK (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Admins manage payments" ON public.payments FOR ALL USING (public.is_admin());

-- Policies for public.warranties
CREATE POLICY "Customers view own warranties" ON public.warranties FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Admins manage warranties" ON public.warranties FOR ALL USING (public.is_admin());

-- Policies for public.maintenance_schedules
CREATE POLICY "Customers view own maintenance" ON public.maintenance_schedules FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Customers can request maintenance" ON public.maintenance_schedules FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Admins manage maintenance" ON public.maintenance_schedules FOR ALL USING (public.is_admin());

-- Policies for public.service_history
CREATE POLICY "Customers view own service history" ON public.service_history FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Admins manage service history" ON public.service_history FOR ALL USING (public.is_admin());

-- Policies for public.customer_messages
CREATE POLICY "Customers view own messages" ON public.customer_messages FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Customers update message read status" ON public.customer_messages FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Admins manage customer messages" ON public.customer_messages FOR ALL USING (public.is_admin());

-- Policies for public.admin_notifications
CREATE POLICY "System can insert notifications" ON public.admin_notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins view and manage notifications" ON public.admin_notifications FOR ALL USING (public.is_admin());

-- Policies for public.services
CREATE POLICY "Public can view active services" ON public.services FOR SELECT USING (is_active = TRUE OR public.is_admin());
CREATE POLICY "Admins manage services" ON public.services FOR ALL USING (public.is_admin());

-- ============================================================================
-- Migration Complete
-- ============================================================================
