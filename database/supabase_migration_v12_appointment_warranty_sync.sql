-- ============================================================================
-- BD22 FIRE SYSTEM & BUILDERS INC. - SUPABASE MIGRATION V12
-- Appointment Booking, Payment Synchronization, Project Completion,
-- Service History, and Automatic 1-Year Warranty Generation
-- ============================================================================

BEGIN;

-- 1. Ensure service_requests table has all needed assessment & booking columns
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
    ADD COLUMN IF NOT EXISTS quotation_amount NUMERIC(12,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS scheduled_date DATE,
    ADD COLUMN IF NOT EXISTS assessment_notes TEXT,
    ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'Unpaid';

-- 2. Ensure inquiries table has payment_status and phone allows empty strings
ALTER TABLE public.inquiries
    ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'Unpaid';

-- 3. Ensure projects table has payment_status and linked_invoice columns
ALTER TABLE public.projects
    ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'Unpaid',
    ADD COLUMN IF NOT EXISTS linked_invoice VARCHAR(50);

-- 4. Fix RLS policies on service_requests
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users submit service requests" ON public.service_requests;
DROP POLICY IF EXISTS "Authenticated users submit service requests" ON public.service_requests;
DROP POLICY IF EXISTS "Users view own service requests" ON public.service_requests;
DROP POLICY IF EXISTS "Customers view own service requests" ON public.service_requests;
DROP POLICY IF EXISTS "Admins manage service requests" ON public.service_requests;
DROP POLICY IF EXISTS "Admins update service requests" ON public.service_requests;
DROP POLICY IF EXISTS "Admins delete service requests" ON public.service_requests;

CREATE POLICY "Users submit service requests" ON public.service_requests
FOR INSERT TO authenticated
WITH CHECK (
    auth.uid() = user_id 
    OR user_id IS NULL 
    OR public.is_admin()
    OR lower(COALESCE(auth.jwt()->>'email', '')) = 'admin@bd22fire.com'
);

CREATE POLICY "Users view own service requests" ON public.service_requests
FOR SELECT TO authenticated
USING (
    auth.uid() = user_id 
    OR public.is_admin()
    OR lower(COALESCE(auth.jwt()->>'email', '')) = 'admin@bd22fire.com'
);

CREATE POLICY "Admins manage service requests" ON public.service_requests
FOR ALL TO authenticated
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

-- 5. Fix RLS policies on inquiries
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can submit inquiry" ON public.inquiries;
DROP POLICY IF EXISTS "Users view own inquiries" ON public.inquiries;
DROP POLICY IF EXISTS "Customers view own inquiries" ON public.inquiries;
DROP POLICY IF EXISTS "Admins manage inquiries" ON public.inquiries;

CREATE POLICY "Anyone can submit inquiry" ON public.inquiries
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users view own inquiries" ON public.inquiries
FOR SELECT TO authenticated
USING (
    auth.uid() = auth_user_id
    OR auth.uid() = user_id
    OR public.is_admin()
    OR lower(COALESCE(auth.jwt()->>'email', '')) = 'admin@bd22fire.com'
);

CREATE POLICY "Admins manage inquiries" ON public.inquiries
FOR ALL TO authenticated
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

-- 6. Fix RLS policies on warranties
ALTER TABLE public.warranties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers view own warranties" ON public.warranties;
DROP POLICY IF EXISTS "Users view own warranties" ON public.warranties;
DROP POLICY IF EXISTS "Admins manage warranties" ON public.warranties;

CREATE POLICY "Users view own warranties" ON public.warranties
FOR SELECT TO authenticated
USING (
    auth.uid() = user_id
    OR public.is_admin()
    OR lower(COALESCE(auth.jwt()->>'email', '')) = 'admin@bd22fire.com'
);

CREATE POLICY "Admins manage warranties" ON public.warranties
FOR ALL TO authenticated
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

-- 7. Fix RLS policies on service_history
ALTER TABLE public.service_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers view own service history" ON public.service_history;
DROP POLICY IF EXISTS "Users view own service history" ON public.service_history;
DROP POLICY IF EXISTS "Admins manage service history" ON public.service_history;

CREATE POLICY "Users view own service history" ON public.service_history
FOR SELECT TO authenticated
USING (
    auth.uid() = user_id
    OR public.is_admin()
    OR lower(COALESCE(auth.jwt()->>'email', '')) = 'admin@bd22fire.com'
);

CREATE POLICY "Admins manage service history" ON public.service_history
FOR ALL TO authenticated
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

-- 8. Grant table permissions to authenticated
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inquiries TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.warranties TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_history TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';

COMMIT;
