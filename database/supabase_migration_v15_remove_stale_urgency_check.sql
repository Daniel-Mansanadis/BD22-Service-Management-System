-- The current repair schema does not constrain service_requests.urgency.
-- CREATE TABLE IF NOT EXISTS does not remove a CHECK left by an older schema.
-- Keep existing appointment rows and values; remove only the obsolete constraint.
BEGIN;

ALTER TABLE public.service_requests
    DROP CONSTRAINT IF EXISTS service_requests_urgency_check;

COMMIT;
