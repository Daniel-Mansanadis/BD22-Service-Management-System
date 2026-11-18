-- Appointment approval and project billing are separate admin workflows.
-- Run after migrations v3 and v4.

-- The current portal records appointment requests in service_requests and
-- mirrors them into inquiries for the Customer Inquiries dashboard.
ALTER TABLE public.service_requests
    DROP CONSTRAINT IF EXISTS service_requests_status_check;
ALTER TABLE public.service_requests
    ADD CONSTRAINT service_requests_status_check CHECK (status IN (
        'Pending Review', 'Under Assessment', 'Quotation Prepared', 'Approved',
        'Rejected', 'Scheduled', 'In Progress', 'Completed', 'Cancelled', 'Urgent'
    ));

-- Older V4 installations may have installed this trigger. Remove it so a
-- manually created project never creates an invoice without an admin action.
DROP TRIGGER IF EXISTS trg_auto_project_invoice ON public.projects;

ALTER TABLE public.projects
    ADD COLUMN IF NOT EXISTS scope_of_work TEXT,
    ADD COLUMN IF NOT EXISTS agreed_cost NUMERIC(12,2),
    ADD COLUMN IF NOT EXISTS warranty_start_date DATE,
    ADD COLUMN IF NOT EXISTS warranty_end_date DATE,
    ADD COLUMN IF NOT EXISTS warranty_status TEXT,
    ADD COLUMN IF NOT EXISTS maintenance_details TEXT;
