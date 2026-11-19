
BEGIN;

DO $$
DECLARE
    v_table TEXT;
    v_user_id_type TEXT;
    v_is_nullable TEXT;
    v_column_default TEXT;
    v_fk RECORD;
    v_fk_count INTEGER;
    v_unmapped_count BIGINT;
    v_delete_action TEXT;
    v_constraint_name TEXT;
BEGIN
    IF to_regclass('public.users') IS NULL
       OR to_regclass('public.profiles') IS NULL THEN
        RAISE EXCEPTION
            'Both public.users (legacy accounts) and public.profiles (Supabase Auth profiles) are required to safely map integer user IDs.';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'users'
          AND column_name = 'id'
          AND data_type IN ('smallint', 'integer', 'bigint')
    ) OR NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'users'
          AND column_name = 'email'
    ) OR NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'profiles'
          AND column_name = 'id'
          AND data_type = 'uuid'
    ) OR NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'profiles'
          AND column_name = 'email'
    ) THEN
        RAISE EXCEPTION
            'Expected public.users(id integer, email) and public.profiles(id uuid, email). No data was migrated.';
    END IF;

    CREATE TEMP TABLE bd22_user_id_map ON COMMIT DROP AS
    SELECT
        u.id::bigint AS legacy_user_id,
        (array_agg(p.id) FILTER (WHERE p.id IS NOT NULL))[1] AS auth_user_id,
        count(p.id)::integer AS profile_matches
    FROM public.users AS u
    LEFT JOIN public.profiles AS p
        ON lower(btrim(p.email)) = lower(btrim(u.email))
    GROUP BY u.id;

    FOREACH v_table IN ARRAY ARRAY[
        'inquiries',
        'service_requests',
        'projects',
        'payments',
        'warranties',
        'maintenance_schedules',
        'service_history',
        'customer_messages'
    ] LOOP
        IF to_regclass('public.' || v_table) IS NULL THEN
            CONTINUE;
        END IF;

        SELECT data_type, is_nullable, column_default
        INTO v_user_id_type, v_is_nullable, v_column_default
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = v_table
          AND column_name = 'user_id';

        IF NOT FOUND OR v_user_id_type = 'uuid' THEN
            CONTINUE;
        END IF;

        IF v_user_id_type NOT IN ('smallint', 'integer', 'bigint') THEN
            RAISE EXCEPTION
                'public.%.user_id has unsupported type %. Expected an integer or UUID; no data was migrated.',
                v_table,
                COALESCE(v_user_id_type, 'unknown');
        END IF;

        IF v_column_default IS NOT NULL THEN
            RAISE EXCEPTION
                'public.%.user_id has a default value (%). Review it before migrating to UUID; no changes were committed.',
                v_table,
                v_column_default;
        END IF;

        EXECUTE format(
            'SELECT count(*) FROM public.%I AS row_data
             LEFT JOIN pg_temp.bd22_user_id_map AS user_map
               ON user_map.legacy_user_id = row_data.user_id::bigint
             WHERE row_data.user_id IS NOT NULL
               AND COALESCE(user_map.profile_matches, 0) <> 1',
            v_table
        ) INTO v_unmapped_count;

        IF v_unmapped_count > 0 THEN
            RAISE EXCEPTION
                'Cannot safely migrate public.%.user_id: % row(s) reference a legacy user without exactly one matching public.profiles email. Create/link those Auth accounts first, then rerun. No changes were committed.',
                v_table,
                v_unmapped_count;
        END IF;

        SELECT count(*)
        INTO v_fk_count
        FROM pg_constraint AS c
        JOIN pg_attribute AS a
          ON a.attrelid = c.conrelid
         AND a.attname = 'user_id'
         AND NOT a.attisdropped
        WHERE c.conrelid = to_regclass('public.' || v_table)
          AND c.contype = 'f'
          AND a.attnum = ANY(c.conkey);

        IF v_fk_count > 1 THEN
            RAISE EXCEPTION
                'public.%.user_id has multiple foreign keys; review them before migrating. No changes were committed.',
                v_table;
        END IF;

        v_delete_action := 'NO ACTION';
        FOR v_fk IN
            SELECT c.conname, c.confrelid, c.confdeltype
            FROM pg_constraint AS c
            JOIN pg_attribute AS a
              ON a.attrelid = c.conrelid
             AND a.attname = 'user_id'
             AND NOT a.attisdropped
            WHERE c.conrelid = to_regclass('public.' || v_table)
              AND c.contype = 'f'
              AND a.attnum = ANY(c.conkey)
        LOOP
            IF v_fk.confrelid <> to_regclass('public.users') THEN
                RAISE EXCEPTION
                    'public.%.user_id references a table other than public.users; review this relationship before migrating. No changes were committed.',
                    v_table;
            END IF;

            IF v_fk.confdeltype = 'd' THEN
                RAISE EXCEPTION
                    'public.%.user_id uses ON DELETE SET DEFAULT; review its legacy default before migrating. No changes were committed.',
                    v_table;
            END IF;

            v_delete_action := CASE v_fk.confdeltype
                WHEN 'c' THEN 'CASCADE'
                WHEN 'n' THEN 'SET NULL'
                WHEN 'r' THEN 'RESTRICT'
                ELSE 'NO ACTION'
            END;
            EXECUTE format(
                'ALTER TABLE public.%I DROP CONSTRAINT %I',
                v_table,
                v_fk.conname
            );
        END LOOP;

        EXECUTE format(
            'ALTER TABLE public.%I ADD COLUMN user_id_auth UUID',
            v_table
        );
        EXECUTE format(
            'UPDATE public.%I AS row_data
             SET user_id_auth = user_map.auth_user_id
             FROM pg_temp.bd22_user_id_map AS user_map
             WHERE row_data.user_id IS NOT NULL
               AND user_map.legacy_user_id = row_data.user_id::bigint',
            v_table
        );

        IF v_is_nullable = 'NO' THEN
            EXECUTE format(
                'ALTER TABLE public.%I ALTER COLUMN user_id_auth SET NOT NULL',
                v_table
            );
        END IF;

        EXECUTE format(
            'ALTER TABLE public.%I DROP COLUMN user_id',
            v_table
        );
        EXECUTE format(
            'ALTER TABLE public.%I RENAME COLUMN user_id_auth TO user_id',
            v_table
        );

        v_constraint_name := left(v_table || '_user_id_fkey', 63);
        EXECUTE format(
            'ALTER TABLE public.%I ADD CONSTRAINT %I
             FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE %s',
            v_table,
            v_constraint_name,
            v_delete_action
        );
    END LOOP;

    FOREACH v_table IN ARRAY ARRAY['projects', 'payments', 'service_requests'] LOOP
        SELECT data_type
        INTO v_user_id_type
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = v_table
          AND column_name = 'user_id';

        IF v_user_id_type IS DISTINCT FROM 'uuid' THEN
            RAISE EXCEPTION
                'Required table public.% is missing or user_id is still not UUID. No changes were committed.',
                v_table;
        END IF;
    END LOOP;
END;
$$;

-- Project fields used by the current admin and customer portals.
ALTER TABLE public.projects
    ADD COLUMN IF NOT EXISTS start_date DATE DEFAULT CURRENT_DATE,
    ADD COLUMN IF NOT EXISTS project_manager TEXT DEFAULT 'Lead Project Engineer',
    ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'Medium',
    ADD COLUMN IF NOT EXISTS budget NUMERIC(12,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS tasks JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS notes TEXT,
    ADD COLUMN IF NOT EXISTS actual_completion_date DATE,
    ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS scope_of_work TEXT,
    ADD COLUMN IF NOT EXISTS agreed_cost NUMERIC(12,2),
    ADD COLUMN IF NOT EXISTS warranty_start_date DATE,
    ADD COLUMN IF NOT EXISTS warranty_end_date DATE,
    ADD COLUMN IF NOT EXISTS warranty_status TEXT,
    ADD COLUMN IF NOT EXISTS maintenance_details TEXT;

-- Keep any existing status values valid while allowing every value used by the app.
DO $$
DECLARE
    v_values TEXT;
BEGIN
    SELECT string_agg(quote_literal(allowed.value), ', ' ORDER BY allowed.value)
    INTO v_values
    FROM (
        SELECT unnest(ARRAY[
            'Not Started', 'In Progress', 'On Hold', 'Completed', 'Planning', 'Scheduled'
        ]) AS value
        UNION
        SELECT DISTINCT status
        FROM public.projects
        WHERE status IS NOT NULL
    ) AS allowed;

    ALTER TABLE public.projects
        DROP CONSTRAINT IF EXISTS projects_status_check,
        DROP CONSTRAINT IF EXISTS projects_priority_check;
    EXECUTE format(
        'ALTER TABLE public.projects ADD CONSTRAINT projects_status_check CHECK (status IN (%s))',
        v_values
    );

    SELECT string_agg(quote_literal(allowed.value), ', ' ORDER BY allowed.value)
    INTO v_values
    FROM (
        SELECT unnest(ARRAY['Low', 'Medium', 'High', 'Urgent', 'Standard']) AS value
        UNION
        SELECT DISTINCT priority
        FROM public.projects
        WHERE priority IS NOT NULL
    ) AS allowed;

    EXECUTE format(
        'ALTER TABLE public.projects ADD CONSTRAINT projects_priority_check CHECK (priority IN (%s))',
        v_values
    );
END;
$$;

-- Invoice fields used by project creation and payment tracking.
ALTER TABLE public.payments
    ADD COLUMN IF NOT EXISTS project_name TEXT,
    ADD COLUMN IF NOT EXISTS amount_paid NUMERIC(12,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS balance NUMERIC(12,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS invoice_date DATE DEFAULT CURRENT_DATE,
    ADD COLUMN IF NOT EXISTS payment_history JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS billing_notes TEXT;

DO $$
DECLARE
    v_values TEXT;
BEGIN
    SELECT string_agg(quote_literal(allowed.value), ', ' ORDER BY allowed.value)
    INTO v_values
    FROM (
        SELECT unnest(ARRAY['Paid', 'Partial', 'Unpaid', 'Pending', 'Overdue']) AS value
        UNION
        SELECT DISTINCT status
        FROM public.payments
        WHERE status IS NOT NULL
    ) AS allowed;

    ALTER TABLE public.payments
        DROP CONSTRAINT IF EXISTS payments_status_check;
    EXECUTE format(
        'ALTER TABLE public.payments ADD CONSTRAINT payments_status_check CHECK (status IN (%s))',
        v_values
    );
END;
$$;

-- Service request fields and values used by the current portal workflow.
ALTER TABLE public.service_requests
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS preferred_timeline TEXT,
    ADD COLUMN IF NOT EXISTS preferred_date DATE,
    ADD COLUMN IF NOT EXISTS establishment_name TEXT,
    ADD COLUMN IF NOT EXISTS building_type TEXT,
    ADD COLUMN IF NOT EXISTS floors TEXT,
    ADD COLUMN IF NOT EXISTS site_address TEXT,
    ADD COLUMN IF NOT EXISTS google_maps_link TEXT,
    ADD COLUMN IF NOT EXISTS contact_name TEXT,
    ADD COLUMN IF NOT EXISTS contact_phone TEXT,
    ADD COLUMN IF NOT EXISTS contact_email TEXT,
    ADD COLUMN IF NOT EXISTS contact_position TEXT,
    ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS additional_concerns TEXT,
    ADD COLUMN IF NOT EXISTS quotation_amount NUMERIC(12,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS scheduled_date DATE,
    ADD COLUMN IF NOT EXISTS assessment_notes TEXT;

DO $$
DECLARE
    v_values TEXT;
BEGIN
    SELECT string_agg(quote_literal(allowed.value), ', ' ORDER BY allowed.value)
    INTO v_values
    FROM (
        SELECT unnest(ARRAY[
            'Pending Review', 'Under Assessment', 'Quotation Prepared', 'Approved',
            'Rejected', 'Scheduled', 'In Progress', 'Completed', 'Cancelled', 'Urgent'
        ]) AS value
        UNION
        SELECT DISTINCT status
        FROM public.service_requests
        WHERE status IS NOT NULL
    ) AS allowed;

    ALTER TABLE public.service_requests
        DROP CONSTRAINT IF EXISTS service_requests_status_check;
    EXECUTE format(
        'ALTER TABLE public.service_requests ADD CONSTRAINT service_requests_status_check CHECK (status IN (%s))',
        v_values
    );

    SELECT string_agg(quote_literal(allowed.value), ', ' ORDER BY allowed.value)
    INTO v_values
    FROM (
        SELECT unnest(ARRAY['Standard', 'Urgent', 'Emergency / Urgent', 'Scheduled']) AS value
        UNION
        SELECT DISTINCT urgency
        FROM public.service_requests
        WHERE urgency IS NOT NULL
    ) AS allowed;

    ALTER TABLE public.service_requests
        DROP CONSTRAINT IF EXISTS service_requests_urgency_check;
    EXECUTE format(
        'ALTER TABLE public.service_requests ADD CONSTRAINT service_requests_urgency_check CHECK (urgency IN (%s))',
        v_values
    );
END;
$$;

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_project_id ON public.payments(project_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_user_id ON public.service_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON public.service_requests(status);
CREATE INDEX IF NOT EXISTS idx_service_requests_reference_no ON public.service_requests(reference_no);

-- Keep administrator writes scoped to authenticated admin profiles.
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

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage projects" ON public.projects;
CREATE POLICY "Admins manage projects"
ON public.projects
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins manage payments" ON public.payments;
CREATE POLICY "Admins manage payments"
ON public.payments
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects, public.payments TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.projects_id_seq, public.payments_id_seq TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Project creation and billing are separate admin actions; prevent duplicate invoices.
DROP TRIGGER IF EXISTS trg_auto_project_invoice ON public.projects;

-- The legacy users table contains password hashes and is not used by the app.
-- Keep it for reference, but make it unavailable through the public API roles.
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.users FROM anon, authenticated;

-- Refresh PostgREST so the API recognizes all newly added columns.
NOTIFY pgrst, 'reload schema';

COMMIT;

SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
      (table_name = 'projects' AND column_name IN ('attachments', 'tasks', 'budget', 'project_manager'))
      OR
      (table_name = 'payments' AND column_name IN ('payment_history', 'amount_paid', 'balance', 'project_name'))
  )
ORDER BY table_name, column_name;
