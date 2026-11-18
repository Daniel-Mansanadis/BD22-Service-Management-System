BEGIN;

CREATE OR REPLACE FUNCTION public.fn_generate_inquiry_reference()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_year TEXT;
    v_seq INT;
BEGIN
    IF NEW.reference_no IS NULL OR TRIM(NEW.reference_no) = '' THEN
        v_year := TO_CHAR(NOW(), 'YYYY');
        SELECT COUNT(*) + 1
        INTO v_seq
        FROM public.inquiries
        WHERE reference_no LIKE 'INQ-' || v_year || '-%';

        LOOP
            NEW.reference_no := 'INQ-' || v_year || '-' || LPAD(v_seq::TEXT, 4, '0');
            EXIT WHEN NOT EXISTS (
                SELECT 1
                FROM public.inquiries
                WHERE reference_no = NEW.reference_no
            );
            v_seq := v_seq + 1;
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_inquiry_ref ON public.inquiries;
CREATE TRIGGER trg_inquiry_ref
    BEFORE INSERT ON public.inquiries
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_generate_inquiry_reference();

COMMIT;
