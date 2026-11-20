-- Apply after the existing Supabase repair/migration scripts.
-- Restrict appointment changes to administrators while allowing customers to
-- create appointments and read only their own service_requests rows.
BEGIN;

ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users submit service requests" ON public.service_requests;
DROP POLICY IF EXISTS "Customers view own service requests" ON public.service_requests;
DROP POLICY IF EXISTS "Admins update service requests" ON public.service_requests;
DROP POLICY IF EXISTS "Admins delete service requests" ON public.service_requests;
DROP POLICY IF EXISTS "Users submit service requests" ON public.service_requests;
DROP POLICY IF EXISTS "Users view own service requests" ON public.service_requests;
DROP POLICY IF EXISTS "Admins manage service requests" ON public.service_requests;
DROP POLICY IF EXISTS "Service requests own or admin" ON public.service_requests;
DROP POLICY IF EXISTS "Service requests insert own" ON public.service_requests;
DROP POLICY IF EXISTS "Service requests select own or admin" ON public.service_requests;
DROP POLICY IF EXISTS "Service requests admin update" ON public.service_requests;
DROP POLICY IF EXISTS "Service requests admin delete" ON public.service_requests;

CREATE POLICY "Service requests insert own"
ON public.service_requests
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Service requests select own or admin"
ON public.service_requests
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Service requests admin update"
ON public.service_requests
FOR UPDATE TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Service requests admin delete"
ON public.service_requests
FOR DELETE TO authenticated
USING (public.is_admin());

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
       AND NOT EXISTS (
           SELECT 1
           FROM pg_publication_tables
           WHERE pubname = 'supabase_realtime'
             AND schemaname = 'public'
             AND tablename = 'service_requests'
       ) THEN
        EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.service_requests';
    END IF;
END;
$$;

COMMIT;
