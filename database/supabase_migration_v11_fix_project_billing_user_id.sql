BEGIN;

-- 1. Safely add missing columns to projects
ALTER TABLE public.projects 
    ADD COLUMN IF NOT EXISTS start_date DATE DEFAULT CURRENT_DATE,
    ADD COLUMN IF NOT EXISTS project_manager TEXT DEFAULT 'Lead Project Engineer',
    ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'Medium',
    ADD COLUMN IF NOT EXISTS budget NUMERIC(12,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS agreed_cost NUMERIC(12,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS scope_of_work TEXT,
    ADD COLUMN IF NOT EXISTS tasks JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS notes TEXT,
    ADD COLUMN IF NOT EXISTS actual_completion_date DATE,
    ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS warranty_start_date DATE,
    ADD COLUMN IF NOT EXISTS warranty_end_date DATE,
    ADD COLUMN IF NOT EXISTS warranty_status TEXT,
    ADD COLUMN IF NOT EXISTS maintenance_details TEXT;

-- 2. Safely add missing columns to payments
ALTER TABLE public.payments 
    ADD COLUMN IF NOT EXISTS project_name TEXT,
    ADD COLUMN IF NOT EXISTS amount_paid NUMERIC(12,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS balance NUMERIC(12,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS invoice_date DATE DEFAULT CURRENT_DATE,
    ADD COLUMN IF NOT EXISTS payment_history JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS billing_notes TEXT,
    ADD COLUMN IF NOT EXISTS method_used TEXT,
    ADD COLUMN IF NOT EXISTS payment_reference TEXT,
    ADD COLUMN IF NOT EXISTS project_id BIGINT;

-- 3. Drop legacy trigger if present to prevent duplicate automatic invoices or type conflicts
DROP TRIGGER IF EXISTS trg_auto_project_invoice ON public.projects;
DROP FUNCTION IF EXISTS public.fn_auto_create_project_invoice();

-- 4. Dynamically & safely convert user_id to UUID across tables
--    IMPORTANT: Drops NOT NULL and foreign keys first so USING NULL never throws ERROR 23502.
DO $$
DECLARE
    tbl TEXT;
    v_type TEXT;
    r RECORD;
    target_tables TEXT[] := ARRAY[
        'projects', 
        'payments', 
        'customer_messages', 
        'warranties', 
        'service_requests', 
        'maintenance_schedules', 
        'service_history', 
        'inquiries'
    ];
BEGIN
    FOREACH tbl IN ARRAY target_tables LOOP
        -- Only proceed if the table exists in public schema
        IF EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = tbl
        ) THEN
            -- Check if user_id column exists
            SELECT data_type INTO v_type 
            FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = tbl AND column_name = 'user_id';

            IF v_type IS NOT NULL THEN
                -- A. Drop NOT NULL constraint first so the column allows NULL values (fixes ERROR 23502)
                EXECUTE format('ALTER TABLE public.%I ALTER COLUMN user_id DROP NOT NULL', tbl);
                EXECUTE format('ALTER TABLE public.%I ALTER COLUMN user_id DROP DEFAULT', tbl);

                -- B. If it is an integer type (smallint, integer, bigint), drop FK constraints and convert to UUID
                IF v_type IN ('smallint', 'integer', 'bigint') THEN
                    -- Find and drop all foreign key constraints involving user_id on this table
                    FOR r IN (
                        SELECT c.conname
                        FROM pg_constraint c
                        JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
                        WHERE c.contype = 'f'
                          AND c.conrelid = ('public.' || quote_ident(tbl))::regclass
                          AND a.attname = 'user_id'
                    ) LOOP
                        EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT IF EXISTS %I CASCADE', tbl, r.conname);
                    END LOOP;

                    -- Convert column type to UUID safely using NULL for legacy integer values
                    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN user_id TYPE UUID USING NULL', tbl);

                    -- Re-add foreign key referencing auth.users(id) with SET NULL on delete
                    BEGIN
                        EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL', 
                                       tbl, 'fk_' || tbl || '_user_id');
                    EXCEPTION WHEN OTHERS THEN
                        -- Ignore if constraint name exists or foreign table is constrained
                        NULL;
                    END;
                END IF;
            END IF;
        END IF;
    END LOOP;
END $$;

-- 5. Ensure admin account profile is marked as admin and is_admin function is robust
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT (
        COALESCE(lower((SELECT auth.jwt()->>'email')), '') = 'admin@bd22fire.com'
        OR COALESCE((SELECT auth.jwt()->'user_metadata'->>'role'), '') = 'admin'
        OR COALESCE((SELECT auth.jwt()->'app_metadata'->>'role'), '') = 'admin'
        OR EXISTS (
            SELECT 1
            FROM public.profiles AS p
            WHERE p.id = (SELECT auth.uid())
              AND (p.role = 'admin' OR lower(p.email) = 'admin@bd22fire.com')
        )
    );
$$;

-- Ensure profiles table has admin record updated
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        UPDATE public.profiles
        SET role = 'admin'
        WHERE lower(email) = 'admin@bd22fire.com';

        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
            INSERT INTO public.profiles (id, email, full_name, role)
            SELECT id, email, COALESCE(raw_user_meta_data->>'full_name', 'BD22 Administrator'), 'admin'
            FROM auth.users
            WHERE lower(email) = 'admin@bd22fire.com'
            ON CONFLICT (id) DO UPDATE SET role = 'admin';
        END IF;
    END IF;
END $$;

-- 6. Ensure RLS policies allow authenticated admins full access to projects and payments
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage projects" ON public.projects;
DROP POLICY IF EXISTS "Admins full projects access" ON public.projects;
DROP POLICY IF EXISTS "Users view own projects" ON public.projects;
DROP POLICY IF EXISTS "Customers view own projects" ON public.projects;
DROP POLICY IF EXISTS "Customers view own projects v4" ON public.projects;

CREATE POLICY "Admins manage projects" ON public.projects 
FOR ALL 
TO authenticated 
USING (
    public.is_admin() 
    OR lower(COALESCE(auth.jwt()->>'email', '')) = 'admin@bd22fire.com'
    OR COALESCE(auth.jwt()->'user_metadata'->>'role', '') = 'admin'
) 
WITH CHECK (
    public.is_admin() 
    OR lower(COALESCE(auth.jwt()->>'email', '')) = 'admin@bd22fire.com'
    OR COALESCE(auth.jwt()->'user_metadata'->>'role', '') = 'admin'
);

CREATE POLICY "Customers view own projects" ON public.projects 
FOR SELECT 
TO authenticated 
USING (
    auth.uid() = user_id 
    OR public.is_admin() 
    OR lower(COALESCE(auth.jwt()->>'email', '')) = 'admin@bd22fire.com'
);

DROP POLICY IF EXISTS "Admins manage payments" ON public.payments;
DROP POLICY IF EXISTS "Admins full payments access" ON public.payments;
DROP POLICY IF EXISTS "Users view own payments" ON public.payments;
DROP POLICY IF EXISTS "Customers view own payments" ON public.payments;
DROP POLICY IF EXISTS "Customers view own payments v4" ON public.payments;
DROP POLICY IF EXISTS "Customers settle own payments v4" ON public.payments;
DROP POLICY IF EXISTS "Customers update own payments" ON public.payments;
DROP POLICY IF EXISTS "Users submit payment confirmation" ON public.payments;
DROP POLICY IF EXISTS "Customers can record payment confirmation" ON public.payments;

CREATE POLICY "Admins manage payments" ON public.payments 
FOR ALL 
TO authenticated 
USING (
    public.is_admin() 
    OR lower(COALESCE(auth.jwt()->>'email', '')) = 'admin@bd22fire.com'
    OR COALESCE(auth.jwt()->'user_metadata'->>'role', '') = 'admin'
) 
WITH CHECK (
    public.is_admin() 
    OR lower(COALESCE(auth.jwt()->>'email', '')) = 'admin@bd22fire.com'
    OR COALESCE(auth.jwt()->'user_metadata'->>'role', '') = 'admin'
);

CREATE POLICY "Customers view own payments" ON public.payments 
FOR SELECT 
TO authenticated 
USING (
    auth.uid() = user_id 
    OR public.is_admin() 
    OR lower(COALESCE(auth.jwt()->>'email', '')) = 'admin@bd22fire.com'
);

CREATE POLICY "Customers settle own payments" ON public.payments 
FOR UPDATE 
TO authenticated 
USING (
    auth.uid() = user_id 
    OR public.is_admin() 
    OR lower(COALESCE(auth.jwt()->>'email', '')) = 'admin@bd22fire.com'
)
WITH CHECK (
    auth.uid() = user_id 
    OR public.is_admin() 
    OR lower(COALESCE(auth.jwt()->>'email', '')) = 'admin@bd22fire.com'
);

-- 7. Grant proper schema permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';

COMMIT;
