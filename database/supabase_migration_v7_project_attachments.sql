-- Reconcile project and invoice columns used by the current Supabase client.
-- Safe to run on existing installations; this does not drop tables or data.
ALTER TABLE public.projects
    ADD COLUMN IF NOT EXISTS start_date DATE DEFAULT CURRENT_DATE,
    ADD COLUMN IF NOT EXISTS project_manager TEXT DEFAULT 'Lead Project Engineer',
    ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'Medium',
    ADD COLUMN IF NOT EXISTS budget NUMERIC(12,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS tasks JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS notes TEXT,
    ADD COLUMN IF NOT EXISTS actual_completion_date DATE,
    ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS scope_of_work TEXT,
    ADD COLUMN IF NOT EXISTS agreed_cost NUMERIC(12,2),
    ADD COLUMN IF NOT EXISTS warranty_start_date DATE,
    ADD COLUMN IF NOT EXISTS warranty_end_date DATE,
    ADD COLUMN IF NOT EXISTS warranty_status TEXT,
    ADD COLUMN IF NOT EXISTS maintenance_details TEXT;

ALTER TABLE public.projects
    DROP CONSTRAINT IF EXISTS projects_status_check,
    DROP CONSTRAINT IF EXISTS projects_priority_check;
ALTER TABLE public.projects
    ADD CONSTRAINT projects_status_check
        CHECK (status IN ('Not Started', 'In Progress', 'On Hold', 'Completed', 'Planning', 'Scheduled')),
    ADD CONSTRAINT projects_priority_check
        CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent'));

ALTER TABLE public.payments
    ADD COLUMN IF NOT EXISTS project_name TEXT,
    ADD COLUMN IF NOT EXISTS amount_paid NUMERIC(12,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS balance NUMERIC(12,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS invoice_date DATE DEFAULT CURRENT_DATE,
    ADD COLUMN IF NOT EXISTS payment_history JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS billing_notes TEXT;

ALTER TABLE public.payments
    DROP CONSTRAINT IF EXISTS payments_status_check;
ALTER TABLE public.payments
    ADD CONSTRAINT payments_status_check
        CHECK (status IN ('Paid', 'Partial', 'Unpaid', 'Pending', 'Overdue'));

-- Refresh PostgREST's cached schema so the new column is recognized immediately.
NOTIFY pgrst, 'reload schema';
