-- Link public appointment inquiries to the authenticated customer profile
-- when the request is submitted from a signed-in customer portal account.
-- Run in the Supabase SQL editor on existing installations.

ALTER TABLE public.inquiries
    ADD COLUMN IF NOT EXISTS submission_source TEXT;

UPDATE public.inquiries
SET submission_source = 'legacy_unknown'
WHERE submission_source IS NULL;

ALTER TABLE public.inquiries
    ALTER COLUMN submission_source SET DEFAULT 'legacy_unknown',
    ALTER COLUMN submission_source SET NOT NULL,
    DROP CONSTRAINT IF EXISTS inquiries_submission_source_check;

ALTER TABLE public.inquiries
    ADD CONSTRAINT inquiries_submission_source_check
    CHECK (submission_source IN (
        'public_visitor',
        'customer_account_verified',
        'customer_account_unverified',
        'signed_in_non_customer',
        'legacy_unknown'
    ));

CREATE OR REPLACE FUNCTION public.submit_public_inquiry(
    customer_name TEXT,
    email TEXT,
    phone TEXT DEFAULT '',
    service_name TEXT DEFAULT 'General Inquiry',
    message TEXT DEFAULT ''
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_inq RECORD;
    v_user_id UUID;
    v_email_verified BOOLEAN;
    v_submission_source TEXT;
BEGIN
    IF (
        SELECT COUNT(*)
        FROM public.inquiries
        WHERE LOWER(inquiries.email) = LOWER(submit_public_inquiry.email)
          AND created_at > NOW() - INTERVAL '15 minutes'
    ) >= 5 THEN
        RAISE EXCEPTION 'Rate limit exceeded: Too many inquiries submitted from this address. Please try again later.'
            USING ERRCODE = 'P0001';
    END IF;

    IF auth.uid() IS NULL THEN
        v_submission_source := 'public_visitor';
    ELSE
        SELECT p.id, u.email_confirmed_at IS NOT NULL
        INTO v_user_id, v_email_verified
        FROM public.profiles p
        JOIN auth.users u ON u.id = p.id
        WHERE p.id = auth.uid()
          AND p.role = 'customer';

        IF v_user_id IS NULL THEN
            v_submission_source := 'signed_in_non_customer';
        ELSIF v_email_verified THEN
            v_submission_source := 'customer_account_verified';
        ELSE
            v_submission_source := 'customer_account_unverified';
        END IF;
    END IF;

    INSERT INTO public.inquiries (
        user_id,
        submission_source,
        customer_name,
        email,
        phone,
        service_name,
        message,
        status
    )
    VALUES (
        v_user_id,
        v_submission_source,
        customer_name,
        email,
        phone,
        service_name,
        message,
        'Pending Review'
    )
    RETURNING * INTO v_inq;

    RETURN jsonb_build_object(
        'id', v_inq.id,
        'reference_no', v_inq.reference_no,
        'user_id', v_inq.user_id,
        'submission_source', v_inq.submission_source,
        'customer_name', v_inq.customer_name,
        'status', v_inq.status
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_public_inquiry(TEXT, TEXT, TEXT, TEXT, TEXT)
    TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
