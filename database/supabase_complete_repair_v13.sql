-- =====================================================================
-- BD22 complete Supabase repair / reconciliation
-- Safe to rerun: creates missing objects and only adds missing columns.
-- Run this once in Supabase Dashboard -> SQL Editor.
-- =====================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    company TEXT DEFAULT 'Facility Operations',
    phone TEXT DEFAULT '',
    role TEXT NOT NULL DEFAULT 'customer',
    pref_sms BOOLEAN NOT NULL DEFAULT true,
    pref_email BOOLEAN NOT NULL DEFAULT true,
    pref_warranty BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Legacy PHP session accounts used by api/auth.php.
CREATE TABLE IF NOT EXISTS public.users (
    id BIGSERIAL PRIMARY KEY,
    role TEXT NOT NULL DEFAULT 'customer',
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    company TEXT DEFAULT 'Facility Operations',
    phone TEXT DEFAULT '',
    pref_sms BOOLEAN NOT NULL DEFAULT true,
    pref_email BOOLEAN NOT NULL DEFAULT true,
    pref_warranty BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.services (
    id BIGSERIAL PRIMARY KEY,
    slug TEXT UNIQUE,
    service_code TEXT UNIQUE,
    title TEXT,
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
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.inquiries (
    id BIGSERIAL PRIMARY KEY,
    reference_no TEXT UNIQUE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    submission_source TEXT NOT NULL DEFAULT 'legacy_unknown',
    customer_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    service_name TEXT NOT NULL,
    message TEXT,
    status TEXT NOT NULL DEFAULT 'Pending Review',
    assigned_staff TEXT NOT NULL DEFAULT 'Unassigned',
    tracking_note TEXT,
    payment_status TEXT NOT NULL DEFAULT 'Unpaid',
    last_update TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.service_requests (
    id BIGSERIAL PRIMARY KEY,
    reference_no TEXT UNIQUE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    service_type TEXT NOT NULL,
    urgency TEXT NOT NULL DEFAULT 'Standard',
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
    quotation_amount NUMERIC(12,2) DEFAULT 0,
    scheduled_date DATE,
    assessment_notes TEXT,
    payment_status TEXT NOT NULL DEFAULT 'Unpaid',
    status TEXT NOT NULL DEFAULT 'Pending Review',
    assigned_staff TEXT NOT NULL DEFAULT 'Unassigned',
    last_update TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.projects (
    id BIGSERIAL PRIMARY KEY,
    project_code TEXT UNIQUE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    assigned_team TEXT DEFAULT 'Team Alpha (Operations)',
    progress INTEGER NOT NULL DEFAULT 0,
    start_date DATE DEFAULT CURRENT_DATE,
    target_date DATE,
    actual_completion_date DATE,
    status TEXT NOT NULL DEFAULT 'In Progress',
    priority TEXT DEFAULT 'Medium',
    project_manager TEXT DEFAULT 'Lead Project Engineer',
    budget NUMERIC(12,2) DEFAULT 0,
    agreed_cost NUMERIC(12,2),
    scope_of_work TEXT,
    milestones TEXT,
    tasks JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    description TEXT,
    attachments JSONB DEFAULT '[]'::jsonb,
    payment_status TEXT NOT NULL DEFAULT 'Unpaid',
    linked_invoice TEXT,
    warranty_start_date DATE,
    warranty_end_date DATE,
    warranty_status TEXT,
    maintenance_details TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.inventory_items (
    id BIGSERIAL PRIMARY KEY,
    item_code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    item_type TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    min_reorder_level INTEGER NOT NULL DEFAULT 2,
    customer_project TEXT DEFAULT 'General Stock',
    service_status TEXT DEFAULT 'Current',
    next_maintenance DATE,
    stock_status TEXT DEFAULT 'Available',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.project_equipment (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT REFERENCES public.projects(id) ON DELETE CASCADE,
    inventory_id BIGINT REFERENCES public.inventory_items(id) ON DELETE RESTRICT,
    allocated_qty INTEGER NOT NULL DEFAULT 1,
    allocated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.payments (
    id BIGSERIAL PRIMARY KEY,
    invoice_no TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    project_id BIGINT REFERENCES public.projects(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    project_name TEXT,
    amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    amount_paid NUMERIC(12,2) NOT NULL DEFAULT 0,
    balance NUMERIC(12,2) NOT NULL DEFAULT 0,
    due_date DATE,
    invoice_date DATE DEFAULT CURRENT_DATE,
    status TEXT NOT NULL DEFAULT 'Pending',
    method_used TEXT,
    payment_reference TEXT,
    payment_history JSONB DEFAULT '[]'::jsonb,
    billing_notes TEXT,
    last_update TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.warranties (
    id BIGSERIAL PRIMARY KEY,
    warranty_code TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    project_id BIGINT REFERENCES public.projects(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    system_covered TEXT NOT NULL,
    install_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'Active',
    coverage_summary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.maintenance_schedules (
    id BIGSERIAL PRIMARY KEY,
    maintenance_code TEXT UNIQUE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    project_id BIGINT REFERENCES public.projects(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    service_type TEXT NOT NULL,
    scheduled_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'Scheduled',
    technician TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

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
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.customer_messages (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.admin_notifications (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'New',
    action_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add columns used by the website without touching existing data.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS submission_source TEXT NOT NULL DEFAULT 'legacy_unknown';
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'Unpaid';
ALTER TABLE public.inquiries ALTER COLUMN phone DROP NOT NULL;

ALTER TABLE public.service_requests ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'Unpaid';
ALTER TABLE public.service_requests ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.service_requests ADD COLUMN IF NOT EXISTS preferred_timeline TEXT;
ALTER TABLE public.service_requests ADD COLUMN IF NOT EXISTS preferred_date DATE;
ALTER TABLE public.service_requests ADD COLUMN IF NOT EXISTS establishment_name TEXT;
ALTER TABLE public.service_requests ADD COLUMN IF NOT EXISTS building_type TEXT;
ALTER TABLE public.service_requests ADD COLUMN IF NOT EXISTS floors TEXT;
ALTER TABLE public.service_requests ADD COLUMN IF NOT EXISTS site_address TEXT;
ALTER TABLE public.service_requests ADD COLUMN IF NOT EXISTS google_maps_link TEXT;
ALTER TABLE public.service_requests ADD COLUMN IF NOT EXISTS contact_name TEXT;
ALTER TABLE public.service_requests ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE public.service_requests ADD COLUMN IF NOT EXISTS contact_email TEXT;
ALTER TABLE public.service_requests ADD COLUMN IF NOT EXISTS contact_position TEXT;
ALTER TABLE public.service_requests ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.service_requests ADD COLUMN IF NOT EXISTS additional_concerns TEXT;
ALTER TABLE public.service_requests ADD COLUMN IF NOT EXISTS quotation_amount NUMERIC(12,2) DEFAULT 0;
ALTER TABLE public.service_requests ADD COLUMN IF NOT EXISTS scheduled_date DATE;
ALTER TABLE public.service_requests ADD COLUMN IF NOT EXISTS assessment_notes TEXT;
ALTER TABLE public.service_requests ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS start_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS actual_completion_date DATE;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS project_manager TEXT DEFAULT 'Lead Project Engineer';
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'Medium';
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS budget NUMERIC(12,2) DEFAULT 0;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS agreed_cost NUMERIC(12,2);
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS scope_of_work TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS tasks JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'Unpaid';
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS linked_invoice TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS warranty_start_date DATE;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS warranty_end_date DATE;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS warranty_status TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS maintenance_details TEXT;

ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS amount_paid NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS balance NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS project_name TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS invoice_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS payment_history JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS billing_notes TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS method_used TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS payment_reference TEXT;

-- Convert legacy integer user_id references to Auth UUIDs by matching email.
-- Abort rather than detach records if any legacy account has no unique profile.
DO $$
DECLARE r RECORD;
BEGIN
    FOR r IN
        SELECT policyname, tablename
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename IN (
              'inquiries','service_requests','projects','payments','warranties',
              'maintenance_schedules','service_history','customer_messages'
          )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
    END LOOP;
END;
$$;

DO $$
DECLARE
    v_table TEXT;
    v_type TEXT;
    v_nullable TEXT;
    v_default TEXT;
    v_fk RECORD;
    v_unmapped BIGINT;
    v_delete_action TEXT;
    v_has_legacy_ids BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name IN (
              'inquiries','service_requests','projects','payments','warranties',
              'maintenance_schedules','service_history','customer_messages'
          )
          AND column_name = 'user_id'
          AND data_type IN ('smallint', 'integer', 'bigint')
    ) INTO v_has_legacy_ids;

    IF v_has_legacy_ids THEN
        IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'users'
              AND column_name = 'id'
              AND data_type NOT IN ('smallint', 'integer', 'bigint')
        ) THEN
            RAISE EXCEPTION
                'Legacy user_id migration expects public.users.id to be an integer. Review account IDs before continuing.';
        END IF;

        CREATE TEMP TABLE bd22_user_id_map ON COMMIT DROP AS
        SELECT
            u.id::bigint AS legacy_user_id,
            (array_agg(p.id) FILTER (WHERE p.id IS NOT NULL))[1] AS auth_user_id,
            count(p.id)::integer AS profile_matches
        FROM public.users u
        LEFT JOIN public.profiles p
          ON lower(btrim(p.email)) = lower(btrim(u.email))
        GROUP BY u.id;

        FOREACH v_table IN ARRAY ARRAY[
        'inquiries', 'service_requests', 'projects', 'payments',
        'warranties', 'maintenance_schedules', 'service_history',
        'customer_messages'
        ] LOOP
        SELECT data_type, is_nullable, column_default
        INTO v_type, v_nullable, v_default
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = v_table
          AND column_name = 'user_id';

        IF NOT FOUND OR v_type = 'uuid' THEN
            CONTINUE;
        END IF;

        IF v_type NOT IN ('smallint', 'integer', 'bigint') THEN
            RAISE EXCEPTION
                'public.%.user_id has unsupported type %. Expected UUID or integer.',
                v_table, v_type;
        END IF;

        IF v_default IS NOT NULL THEN
            RAISE EXCEPTION
                'public.%.user_id has a default (%). Review it before migrating to UUID.',
                v_table, v_default;
        END IF;

        EXECUTE format(
            'SELECT count(*) FROM public.%I d
             LEFT JOIN pg_temp.bd22_user_id_map m
               ON m.legacy_user_id = d.user_id::bigint
             WHERE d.user_id IS NOT NULL AND COALESCE(m.profile_matches, 0) <> 1',
            v_table
        ) INTO v_unmapped;

        IF v_unmapped > 0 THEN
            RAISE EXCEPTION
                'Cannot migrate public.%.user_id: % row(s) lack exactly one matching Auth profile by email. Link/create those profiles, then rerun; no changes were committed.',
                v_table, v_unmapped;
        END IF;

        v_delete_action := 'NO ACTION';
        FOR v_fk IN
            SELECT c.conname, c.confrelid, c.confdeltype, cardinality(c.conkey) AS key_count
            FROM pg_constraint c
            JOIN pg_attribute a
              ON a.attrelid = c.conrelid
             AND a.attname = 'user_id'
             AND NOT a.attisdropped
            WHERE c.conrelid = to_regclass('public.' || v_table)
              AND c.contype = 'f'
              AND a.attnum = ANY(c.conkey)
        LOOP
            IF v_fk.key_count <> 1 OR v_fk.confrelid <> to_regclass('public.users') THEN
                RAISE EXCEPTION
                    'public.%.user_id has a non-standard foreign key. Review it before migrating.',
                    v_table;
            END IF;

            v_delete_action := CASE v_fk.confdeltype
                WHEN 'c' THEN 'CASCADE'
                WHEN 'n' THEN 'SET NULL'
                WHEN 'r' THEN 'RESTRICT'
                WHEN 'd' THEN 'SET DEFAULT'
                ELSE 'NO ACTION'
            END;
            EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT %I', v_table, v_fk.conname);
        END LOOP;

        EXECUTE format('ALTER TABLE public.%I ADD COLUMN user_id_auth UUID', v_table);
        EXECUTE format(
            'UPDATE public.%I d
             SET user_id_auth = m.auth_user_id
             FROM pg_temp.bd22_user_id_map m
             WHERE d.user_id IS NOT NULL AND m.legacy_user_id = d.user_id::bigint',
            v_table
        );

        IF v_nullable = 'NO' THEN
            EXECUTE format('ALTER TABLE public.%I ALTER COLUMN user_id_auth SET NOT NULL', v_table);
        END IF;

        EXECUTE format('ALTER TABLE public.%I DROP COLUMN user_id', v_table);
        EXECUTE format('ALTER TABLE public.%I RENAME COLUMN user_id_auth TO user_id', v_table);
        EXECUTE format(
            'ALTER TABLE public.%I ADD CONSTRAINT %I
             FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE %s',
            v_table, left(v_table || '_user_id_fkey', 63), v_delete_action
        );
        END LOOP;
    END IF;
END;
$$;

-- Robust administrator check used by RLS.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT
        lower(COALESCE((SELECT auth.jwt()->>'email'), '')) = 'admin@bd22fire.com'
        OR lower(COALESCE((SELECT auth.jwt()->'app_metadata'->>'role'), '')) = 'admin'
        OR lower(COALESCE((SELECT auth.jwt()->'user_metadata'->>'role'), '')) = 'admin'
        OR EXISTS (
            SELECT 1
            FROM public.profiles p
            WHERE p.id = (SELECT auth.uid())
              AND (p.role = 'admin' OR lower(p.email) = 'admin@bd22fire.com')
        );
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_name TEXT;
    v_role TEXT;
BEGIN
    v_name := COALESCE(NEW.raw_user_meta_data->>'full_name',
                       NEW.raw_user_meta_data->>'name',
                       split_part(NEW.email, '@', 1));
    v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'customer');
    IF lower(NEW.email) = 'admin@bd22fire.com' THEN
        v_role := 'admin';
    END IF;

    INSERT INTO public.profiles (
        id, email, full_name, company, phone, role
    )
    VALUES (
        NEW.id,
        NEW.email,
        v_name,
        COALESCE(NEW.raw_user_meta_data->>'company', 'Facility Operations'),
        COALESCE(NEW.raw_user_meta_data->>'phone', ''),
        v_role
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        company = EXCLUDED.company,
        phone = EXCLUDED.phone,
        role = EXCLUDED.role,
        updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Reference generators.
CREATE OR REPLACE FUNCTION public.fn_generate_inquiry_reference()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE v_year TEXT; v_seq INTEGER;
BEGIN
    IF NEW.reference_no IS NULL OR btrim(NEW.reference_no) = '' THEN
        v_year := to_char(now(), 'YYYY');
        v_seq := 1;
        LOOP
            NEW.reference_no := 'INQ-' || v_year || '-' || lpad(v_seq::text, 4, '0');
            EXIT WHEN NOT EXISTS (SELECT 1 FROM public.inquiries i WHERE i.reference_no = NEW.reference_no);
            v_seq := v_seq + 1;
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_inquiry_ref ON public.inquiries;
CREATE TRIGGER trg_inquiry_ref BEFORE INSERT ON public.inquiries
FOR EACH ROW EXECUTE FUNCTION public.fn_generate_inquiry_reference();

CREATE OR REPLACE FUNCTION public.fn_generate_service_req_reference()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE v_year TEXT; v_seq INTEGER;
BEGIN
    IF NEW.reference_no IS NULL OR btrim(NEW.reference_no) = '' THEN
        v_year := to_char(now(), 'YYYY');
        v_seq := 1;
        LOOP
            NEW.reference_no := 'REQ-' || v_year || '-' || lpad(v_seq::text, 4, '0');
            EXIT WHEN NOT EXISTS (SELECT 1 FROM public.service_requests s WHERE s.reference_no = NEW.reference_no);
            v_seq := v_seq + 1;
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_service_req_ref ON public.service_requests;
CREATE TRIGGER trg_service_req_ref BEFORE INSERT ON public.service_requests
FOR EACH ROW EXECUTE FUNCTION public.fn_generate_service_req_reference();

CREATE OR REPLACE FUNCTION public.fn_generate_project_code()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE v_seq INTEGER;
BEGIN
    IF NEW.project_code IS NULL OR btrim(NEW.project_code) = '' THEN
        v_seq := 1;
        LOOP
            NEW.project_code := 'proj-' || v_seq;
            EXIT WHEN NOT EXISTS (SELECT 1 FROM public.projects p WHERE p.project_code = NEW.project_code);
            v_seq := v_seq + 1;
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_project_code ON public.projects;
CREATE TRIGGER trg_project_code BEFORE INSERT ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.fn_generate_project_code();

-- Reapply key RLS policies deterministically.
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

DO $$
DECLARE r RECORD;
BEGIN
    FOR r IN
        SELECT policyname, tablename
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename IN (
              'profiles','inquiries','service_requests','projects','inventory_items',
              'payments','warranties','maintenance_schedules','service_history',
              'customer_messages','admin_notifications','services'
          )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
    END LOOP;
END;
$$;

CREATE POLICY "Profiles own or admin" ON public.profiles
FOR ALL TO authenticated
USING (auth.uid() = id OR public.is_admin())
WITH CHECK (auth.uid() = id OR public.is_admin());

CREATE POLICY "Inquiries public insert" ON public.inquiries
FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Inquiries own or admin select" ON public.inquiries
FOR SELECT TO authenticated
USING ((auth_user_id IS NOT NULL AND auth.uid() = auth_user_id)
       OR (user_id IS NOT NULL AND auth.uid() = user_id)
       OR public.is_admin());
CREATE POLICY "Inquiries admin all" ON public.inquiries
FOR ALL TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Service requests own or admin" ON public.service_requests
FOR ALL TO authenticated
USING ((user_id IS NOT NULL AND auth.uid() = user_id) OR public.is_admin())
WITH CHECK ((user_id IS NOT NULL AND auth.uid() = user_id) OR public.is_admin());

CREATE POLICY "Projects own or admin" ON public.projects
FOR ALL TO authenticated
USING ((user_id IS NOT NULL AND auth.uid() = user_id) OR public.is_admin())
WITH CHECK ((user_id IS NOT NULL AND auth.uid() = user_id) OR public.is_admin());

CREATE POLICY "Inventory public read" ON public.inventory_items
FOR SELECT TO anon, authenticated
USING (is_active = true OR public.is_admin());
CREATE POLICY "Inventory admin all" ON public.inventory_items
FOR ALL TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Payments own or admin" ON public.payments
FOR ALL TO authenticated
USING ((user_id IS NOT NULL AND auth.uid() = user_id) OR public.is_admin())
WITH CHECK ((user_id IS NOT NULL AND auth.uid() = user_id) OR public.is_admin());

CREATE POLICY "Warranties own or admin" ON public.warranties
FOR ALL TO authenticated
USING ((user_id IS NOT NULL AND auth.uid() = user_id) OR public.is_admin())
WITH CHECK ((user_id IS NOT NULL AND auth.uid() = user_id) OR public.is_admin());

CREATE POLICY "Maintenance own or admin" ON public.maintenance_schedules
FOR ALL TO authenticated
USING ((user_id IS NOT NULL AND auth.uid() = user_id) OR public.is_admin())
WITH CHECK ((user_id IS NOT NULL AND auth.uid() = user_id) OR public.is_admin());

CREATE POLICY "History own or admin" ON public.service_history
FOR ALL TO authenticated
USING ((user_id IS NOT NULL AND auth.uid() = user_id) OR public.is_admin())
WITH CHECK ((user_id IS NOT NULL AND auth.uid() = user_id) OR public.is_admin());

CREATE POLICY "Messages own or admin" ON public.customer_messages
FOR ALL TO authenticated
USING ((user_id IS NOT NULL AND auth.uid() = user_id) OR public.is_admin())
WITH CHECK ((user_id IS NOT NULL AND auth.uid() = user_id) OR public.is_admin());

CREATE POLICY "Notifications system insert" ON public.admin_notifications
FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Notifications admin all" ON public.admin_notifications
FOR ALL TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Services public read" ON public.services
FOR SELECT TO anon, authenticated
USING (is_active = true OR public.is_admin());
CREATE POLICY "Services admin all" ON public.services
FOR ALL TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
COMMIT;

-- Run this diagnostic after the repair:
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema='public' ORDER BY table_name;
