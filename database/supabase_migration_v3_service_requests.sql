-- ============================================================================
-- BD22 FIRE SYSTEM & BUILDERS INC.
-- Database Migration V3: Comprehensive Service Requests & Assessment Lifecycle
-- ============================================================================

-- 1. Expand status CHECK constraint on service_requests
ALTER TABLE public.service_requests 
    DROP CONSTRAINT IF EXISTS service_requests_status_check;

ALTER TABLE public.service_requests 
    ADD CONSTRAINT service_requests_status_check 
    CHECK (status IN (
        'Pending Review', 
        'Under Assessment', 
        'Quotation Prepared', 
        'Approved', 
        'Scheduled', 
        'In Progress', 
        'Completed', 
        'Cancelled'
    ));

-- 2. Add rich site, contact, schedule, and assessment columns
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

-- 3. Update Service Request Reference Generator to BD22-REQ-YYYY-NNN format
CREATE OR REPLACE FUNCTION public.fn_generate_service_req_reference()
RETURNS TRIGGER AS $$
DECLARE
    v_year TEXT;
    v_seq INT;
BEGIN
    IF NEW.reference_no IS NULL OR TRIM(NEW.reference_no) = '' THEN
        v_year := TO_CHAR(NOW(), 'YYYY');
        SELECT COUNT(*) + 1 INTO v_seq 
        FROM public.service_requests 
        WHERE reference_no LIKE 'BD22-REQ-' || v_year || '-%' OR reference_no LIKE 'REQ-' || v_year || '-%';
        
        LOOP
            NEW.reference_no := 'BD22-REQ-' || v_year || '-' || LPAD(v_seq::TEXT, 3, '0');
            EXIT WHEN NOT EXISTS (SELECT 1 FROM public.service_requests WHERE reference_no = NEW.reference_no);
            v_seq := v_seq + 1;
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_service_req_ref ON public.service_requests;
CREATE TRIGGER trg_service_req_ref
    BEFORE INSERT ON public.service_requests
    FOR EACH ROW EXECUTE FUNCTION public.fn_generate_service_req_reference();

-- 4. Notification trigger on service request creation
CREATE OR REPLACE FUNCTION public.fn_notify_admin_on_service_request()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.admin_notifications (title, description, status, action_url)
    VALUES (
        'New Service Request: ' || COALESCE(NEW.establishment_name, NEW.customer_name) || ' (' || NEW.reference_no || ')',
        'Service: ' || NEW.service_type || ' • Urgency: ' || NEW.urgency || COALESCE(' • Preferred: ' || TO_CHAR(NEW.preferred_date, 'Mon DD, YYYY'), ''),
        'New',
        'admin.html#admin-service-requests'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Helpful index on service requests
CREATE INDEX IF NOT EXISTS idx_service_requests_user_id ON public.service_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON public.service_requests(status);
CREATE INDEX IF NOT EXISTS idx_service_requests_ref ON public.service_requests(reference_no);
