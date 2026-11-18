-- Restore admin-only access to inventory writes with an explicit insert/update check.
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

DROP POLICY IF EXISTS "Admins manage inventory" ON public.inventory_items;

CREATE POLICY "Admins manage inventory"
ON public.inventory_items
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

GRANT SELECT, INSERT, UPDATE ON public.inventory_items TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.inventory_items_id_seq TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
