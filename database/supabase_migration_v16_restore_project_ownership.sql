BEGIN;

-- Restore ownership for older app-created projects whose Auth UUID was stored
-- in the description because the projects.user_id column had a legacy type.
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS description TEXT;

WITH tagged_projects AS (
    SELECT
        p.id,
        (regexp_match(
            COALESCE(p.description, ''),
            '\[auth_user_id:\s*([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})\]'
        ))[1]::uuid AS auth_user_id
    FROM public.projects p
    WHERE p.user_id IS NULL
)
UPDATE public.projects p
SET user_id = tagged_projects.auth_user_id
FROM tagged_projects
WHERE p.id = tagged_projects.id
  AND tagged_projects.auth_user_id IS NOT NULL
  AND EXISTS (
      SELECT 1 FROM auth.users u WHERE u.id = tagged_projects.auth_user_id
  );

COMMIT;
