-- ============================================================================
-- BD22 FIRE SYSTEM & BUILDERS INC. - PERMANENT PROJECT PURGE
-- Permanently delete all existing projects. Customer accounts are NOT touched.
-- ============================================================================

BEGIN;

-- 1. Unlink project references in payments, warranties, schedules, and service history
UPDATE public.payments SET project_id = NULL WHERE project_id IS NOT NULL;
UPDATE public.warranties SET project_id = NULL WHERE project_id IS NOT NULL;
UPDATE public.maintenance_schedules SET project_id = NULL WHERE project_id IS NOT NULL;
UPDATE public.service_history SET project_id = NULL WHERE project_id IS NOT NULL;

-- 2. Delete any project equipment allocations
DELETE FROM public.project_equipment;

-- 3. Delete all projects permanently from public.projects
DELETE FROM public.projects;

-- 4. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';

COMMIT;
