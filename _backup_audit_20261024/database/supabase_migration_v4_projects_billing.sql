-- ============================================================================
-- BD22 FIRE SYSTEM & BUILDERS INC. - SUPABASE MIGRATION V4
-- Enhanced Project Management & Payment/Billing Integration
-- ============================================================================

-- 1. Enhance Projects Table with Comprehensive Fields
ALTER TABLE public.projects 
    ADD COLUMN IF NOT EXISTS start_date DATE DEFAULT CURRENT_DATE,
    ADD COLUMN IF NOT EXISTS project_manager TEXT DEFAULT 'Lead Project Engineer',
    ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
    ADD COLUMN IF NOT EXISTS budget NUMERIC(12,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS tasks JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS notes TEXT,
    ADD COLUMN IF NOT EXISTS actual_completion_date DATE,
    ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;

-- Adjust project status constraint to support 'Not Started', 'In Progress', 'On Hold', 'Completed'
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_status_check;
ALTER TABLE public.projects ADD CONSTRAINT projects_status_check 
    CHECK (status IN ('Not Started', 'In Progress', 'On Hold', 'Completed', 'Planning', 'Scheduled'));

-- 2. Enhance Payments (Client Invoices) Table
ALTER TABLE public.payments 
    ADD COLUMN IF NOT EXISTS amount_paid NUMERIC(12,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS balance NUMERIC(12,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS invoice_date DATE DEFAULT CURRENT_DATE,
    ADD COLUMN IF NOT EXISTS payment_history JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS billing_notes TEXT;

-- Adjust payment status constraint to support 'Paid', 'Partial', 'Unpaid', 'Pending', 'Overdue'
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_status_check;
ALTER TABLE public.payments ADD CONSTRAINT payments_status_check 
    CHECK (status IN ('Paid', 'Partial', 'Unpaid', 'Pending', 'Overdue'));

-- 3. Automatic Project Code Generator Trigger (BD22-PRJ-YYYY-NNN)
CREATE OR REPLACE FUNCTION public.fn_generate_project_code_v4()
RETURNS TRIGGER AS $$
DECLARE
    v_year TEXT;
    v_seq INT;
BEGIN
    IF NEW.project_code IS NULL OR TRIM(NEW.project_code) = '' OR NEW.project_code LIKE 'proj-%' THEN
        v_year := TO_CHAR(NOW(), 'YYYY');
        SELECT COUNT(*) + 1 INTO v_seq FROM public.projects WHERE project_code LIKE 'BD22-PRJ-' || v_year || '-%';
        LOOP
            NEW.project_code := 'BD22-PRJ-' || v_year || '-' || LPAD(v_seq::TEXT, 3, '0');
            EXIT WHEN NOT EXISTS (SELECT 1 FROM public.projects WHERE project_code = NEW.project_code);
            v_seq := v_seq + 1;
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_project_code ON public.projects;
DROP TRIGGER IF EXISTS trg_project_code_v4 ON public.projects;
CREATE TRIGGER trg_project_code_v4
    BEFORE INSERT ON public.projects
    FOR EACH ROW EXECUTE FUNCTION public.fn_generate_project_code_v4();

-- 4. Automatic Linked Invoice Generator Trigger (BD22-INV-YYYY-NNN)
CREATE OR REPLACE FUNCTION public.fn_auto_create_invoice_for_project()
RETURNS TRIGGER AS $$
DECLARE
    v_year TEXT;
    v_seq INT;
    v_inv_no TEXT;
    v_due DATE;
    v_budget NUMERIC(12,2);
BEGIN
    v_year := TO_CHAR(NOW(), 'YYYY');
    SELECT COUNT(*) + 1 INTO v_seq FROM public.payments WHERE invoice_no LIKE 'BD22-INV-' || v_year || '-%' OR invoice_no LIKE 'INV-' || v_year || '-%';
    LOOP
        v_inv_no := 'BD22-INV-' || v_year || '-' || LPAD(v_seq::TEXT, 3, '0');
        EXIT WHEN NOT EXISTS (SELECT 1 FROM public.payments WHERE invoice_no = v_inv_no);
        v_seq := v_seq + 1;
    END LOOP;

    v_budget := COALESCE(NEW.budget, 0.00);
    v_due := COALESCE(NEW.target_date, CURRENT_DATE + INTERVAL '30 days');

    -- Insert linked invoice record
    INSERT INTO public.payments (
        invoice_no,
        user_id,
        project_id,
        customer_name,
        project_name,
        amount,
        amount_paid,
        balance,
        due_date,
        invoice_date,
        status,
        billing_notes,
        created_at
    ) VALUES (
        v_inv_no,
        NEW.user_id,
        NEW.id,
        NEW.customer_name,
        NEW.name,
        v_budget,
        0.00,
        v_budget,
        v_due,
        CURRENT_DATE,
        'Unpaid',
        'Automatic contract billing generated from Project ' || COALESCE(NEW.project_code, 'creation'),
        NOW()
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_project_invoice ON public.projects;
CREATE TRIGGER trg_auto_project_invoice
    AFTER INSERT ON public.projects
    FOR EACH ROW EXECUTE FUNCTION public.fn_auto_create_invoice_for_project();

-- 5. RLS Policy Updates for Project Management and Payments
-- Admins have full access, customers only access their own
CREATE POLICY "Admins full projects access" ON public.projects FOR ALL USING (public.is_admin());
CREATE POLICY "Customers view own projects v4" ON public.projects FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Admins full payments access" ON public.payments FOR ALL USING (public.is_admin());
CREATE POLICY "Customers view own payments v4" ON public.payments FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Customers settle own payments v4" ON public.payments FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());

-- ============================================================================
-- End of Migration V4
-- ============================================================================
