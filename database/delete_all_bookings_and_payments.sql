-- ============================================================================
-- BD22 FIRE SYSTEM & BUILDERS INC. - PERMANENT BOOKINGS & PAYMENTS PURGE
-- Permanently delete all existing bookings (inquiries & service requests) and payments.
-- Customer accounts, profiles, and credentials remain 100% UNTOUCHED.
-- ============================================================================

BEGIN;

-- 1. Delete all existing payments and billing statements
DELETE FROM public.payments;

-- 2. Delete all existing service requests and client bookings
DELETE FROM public.service_requests;

-- 3. Delete all existing inquiries
DELETE FROM public.inquiries;

-- 4. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';

COMMIT;
