/*
# CMS, Work Order, Payment, and DPR Schema Extensions

1. Overview
   This migration extends the existing PMS/CMS schema with:
   - Full CMS project header fields on the `projects` table (additive columns only).
   - A `work_order_details` table for WO-level agency, scope, value, and nodal officer data.
   - A `wo_sections` table for WO drill-down sections (drawings, equipment, civil, manpower, quality).
   - A `payment_entries` table for cumulative payment logging with guardrail support.
   - A `dpr_entries` table for Daily Progress Report entries by site engineers.
   - An `amendments` table for post-finalization revision/escalation requests.

   All changes are ADDITIVE — no existing columns or tables are removed or modified.
   The app uses demo login (no Supabase Auth), so all policies use `TO anon, authenticated`.

2. projects table — new columns (added via DO block, idempotent)
   - project_type: 'EPC' or 'PMC' (default 'EPC')
   - project_code: text
   - segment_id: text
   - client_name: text
   - contract_type_id: text
   - scheme_id: text
   - tender_ref_number: text
   - site_city: text
   - region_id: text
   - site_address_a: text
   - site_address_b: text
   - pin_code: text
   - engineer_incharge_id: text
   - phone_number: text
   - email_id: text
   - work_category_id: text
   - workorder_value: numeric (₹ Cr)
   - security_deposit: numeric
   - sd_bg_number: text
   - sd_bg_valid_from: date
   - sd_bg_valid_to: date
   - claim_period_upto: date
   - status: text ('draft' or 'finalized', default 'draft')
   - drawing_pct: numeric (scope allocation %)
   - supply_pct: numeric
   - civil_pct: numeric
   - manpower_pct: numeric
   - others_pct: numeric

3. New Tables
   - work_order_details: WO-level metadata (agency, type, scope, value, dates, payment terms, nodal officer).
   - wo_sections: WO drill-down section data (drawing status, equipment, civil, manpower, quality).
   - payment_entries: Payment log with cumulative tracking.
   - dpr_entries: Daily Progress Report entries.
   - amendments: Post-finalization revision / escalation requests.

4. Security
   - RLS enabled on all new tables.
   - All tables allow anon + authenticated full CRUD (single-tenant demo app with no Supabase Auth).
   - `USING (true)` / `WITH CHECK (true)` is acceptable here because the app has no sign-in and all data is intentionally shared.
*/

-- =============================================
-- 2. Add CMS columns to projects (idempotent)
-- =============================================
DO $$
BEGIN
  -- Identity & classification
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='project_type') THEN
    ALTER TABLE projects ADD COLUMN project_type text NOT NULL DEFAULT 'EPC';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='project_code') THEN
    ALTER TABLE projects ADD COLUMN project_code text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='segment_id') THEN
    ALTER TABLE projects ADD COLUMN segment_id text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='client_name') THEN
    ALTER TABLE projects ADD COLUMN client_name text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='contract_type_id') THEN
    ALTER TABLE projects ADD COLUMN contract_type_id text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='scheme_id') THEN
    ALTER TABLE projects ADD COLUMN scheme_id text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='tender_ref_number') THEN
    ALTER TABLE projects ADD COLUMN tender_ref_number text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='work_category_id') THEN
    ALTER TABLE projects ADD COLUMN work_category_id text;
  END IF;

  -- Location
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='site_city') THEN
    ALTER TABLE projects ADD COLUMN site_city text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='region_id') THEN
    ALTER TABLE projects ADD COLUMN region_id text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='site_address_a') THEN
    ALTER TABLE projects ADD COLUMN site_address_a text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='site_address_b') THEN
    ALTER TABLE projects ADD COLUMN site_address_b text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='pin_code') THEN
    ALTER TABLE projects ADD COLUMN pin_code text;
  END IF;

  -- Personnel
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='engineer_incharge_id') THEN
    ALTER TABLE projects ADD COLUMN engineer_incharge_id text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='phone_number') THEN
    ALTER TABLE projects ADD COLUMN phone_number text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='email_id') THEN
    ALTER TABLE projects ADD COLUMN email_id text;
  END IF;

  -- Financial / security deposit
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='workorder_value') THEN
    ALTER TABLE projects ADD COLUMN workorder_value numeric DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='security_deposit') THEN
    ALTER TABLE projects ADD COLUMN security_deposit numeric DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='sd_bg_number') THEN
    ALTER TABLE projects ADD COLUMN sd_bg_number text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='sd_bg_valid_from') THEN
    ALTER TABLE projects ADD COLUMN sd_bg_valid_from date;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='sd_bg_valid_to') THEN
    ALTER TABLE projects ADD COLUMN sd_bg_valid_to date;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='claim_period_upto') THEN
    ALTER TABLE projects ADD COLUMN claim_period_upto date;
  END IF;

  -- Status & scope allocation
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='status') THEN
    ALTER TABLE projects ADD COLUMN status text NOT NULL DEFAULT 'draft';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='drawing_pct') THEN
    ALTER TABLE projects ADD COLUMN drawing_pct numeric DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='supply_pct') THEN
    ALTER TABLE projects ADD COLUMN supply_pct numeric DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='civil_pct') THEN
    ALTER TABLE projects ADD COLUMN civil_pct numeric DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='manpower_pct') THEN
    ALTER TABLE projects ADD COLUMN manpower_pct numeric DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='others_pct') THEN
    ALTER TABLE projects ADD COLUMN others_pct numeric DEFAULT 0;
  END IF;
END $$;

-- =============================================
-- 3a. work_order_details
-- =============================================
CREATE TABLE IF NOT EXISTS work_order_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id uuid NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  agency_name text NOT NULL DEFAULT '',
  agency_type text NOT NULL DEFAULT '',
  scope text NOT NULL DEFAULT '',
  wo_value numeric DEFAULT 0,
  payment_terms text,
  nodal_officer text,
  start_date date,
  end_date date,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE work_order_details ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_wo_details" ON work_order_details;
CREATE POLICY "anon_select_wo_details" ON work_order_details FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_wo_details" ON work_order_details;
CREATE POLICY "anon_insert_wo_details" ON work_order_details FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_wo_details" ON work_order_details;
CREATE POLICY "anon_update_wo_details" ON work_order_details FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_wo_details" ON work_order_details;
CREATE POLICY "anon_delete_wo_details" ON work_order_details FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_wo_details_work_order_id ON work_order_details(work_order_id);

-- =============================================
-- 3b. wo_sections
-- =============================================
CREATE TABLE IF NOT EXISTS wo_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id uuid NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  section_type text NOT NULL,
  -- 'drawing' | 'equipment' | 'civil' | 'manpower' | 'quality'
  discipline text,
  -- e.g. Civil, Mechanical, Electrical, Vessels/Piping (for drawing section)
  item_code text,
  description text,
  unit text,
  required_qty numeric DEFAULT 0,
  executed_qty numeric DEFAULT 0,
  cat1_total numeric DEFAULT 0,
  cat2_total numeric DEFAULT 0,
  cat3_total numeric DEFAULT 0,
  skilled_count integer DEFAULT 0,
  unskilled_count integer DEFAULT 0,
  target_deployment text,
  value numeric DEFAULT 0,
  certificate_name text,
  has_certificate boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE wo_sections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_wo_sections" ON wo_sections;
CREATE POLICY "anon_select_wo_sections" ON wo_sections FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_wo_sections" ON wo_sections;
CREATE POLICY "anon_insert_wo_sections" ON wo_sections FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_wo_sections" ON wo_sections;
CREATE POLICY "anon_update_wo_sections" ON wo_sections FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_wo_sections" ON wo_sections;
CREATE POLICY "anon_delete_wo_sections" ON wo_sections FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_wo_sections_work_order_id ON wo_sections(work_order_id);

-- =============================================
-- 3c. payment_entries
-- =============================================
CREATE TABLE IF NOT EXISTS payment_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id uuid NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  amount_paid numeric NOT NULL DEFAULT 0,
  cumulative_paid numeric NOT NULL DEFAULT 0,
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  remarks text,
  created_by text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE payment_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_payments" ON payment_entries;
CREATE POLICY "anon_select_payments" ON payment_entries FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_payments" ON payment_entries;
CREATE POLICY "anon_insert_payments" ON payment_entries FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_payments" ON payment_entries;
CREATE POLICY "anon_update_payments" ON payment_entries FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_payments" ON payment_entries;
CREATE POLICY "anon_delete_payments" ON payment_entries FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_payment_entries_wo_id ON payment_entries(work_order_id);

-- =============================================
-- 3d. dpr_entries
-- =============================================
CREATE TABLE IF NOT EXISTS dpr_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  work_order_id uuid REFERENCES work_orders(id) ON DELETE CASCADE,
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  drawing_cat1 integer DEFAULT 0,
  drawing_cat2 integer DEFAULT 0,
  drawing_cat3 integer DEFAULT 0,
  civil_item_qty numeric DEFAULT 0,
  civil_item_desc text,
  manpower_skilled integer DEFAULT 0,
  manpower_unskilled integer DEFAULT 0,
  remarks text,
  created_by text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE dpr_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_dpr" ON dpr_entries;
CREATE POLICY "anon_select_dpr" ON dpr_entries FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_dpr" ON dpr_entries;
CREATE POLICY "anon_insert_dpr" ON dpr_entries FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_dpr" ON dpr_entries;
CREATE POLICY "anon_update_dpr" ON dpr_entries FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_dpr" ON dpr_entries;
CREATE POLICY "anon_delete_dpr" ON dpr_entries FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_dpr_entries_project_id ON dpr_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_dpr_entries_wo_id ON dpr_entries(work_order_id);

-- =============================================
-- 3e. amendments
-- =============================================
CREATE TABLE IF NOT EXISTS amendments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  work_order_id uuid REFERENCES work_orders(id) ON DELETE CASCADE,
  amendment_type text NOT NULL,
  -- 'project_revision' | 'wo_value_escalation' | 'scope_deviation'
  reason text NOT NULL,
  requested_by text NOT NULL,
  revised_value numeric,
  approval_doc_name text,
  approval_status text NOT NULL DEFAULT 'pending',
  -- 'pending' | 'approved' | 'rejected'
  approved_by text,
  approved_at timestamptz,
  noting_entries text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE amendments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_amendments" ON amendments;
CREATE POLICY "anon_select_amendments" ON amendments FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_amendments" ON amendments;
CREATE POLICY "anon_insert_amendments" ON amendments FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_amendments" ON amendments;
CREATE POLICY "anon_update_amendments" ON amendments FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_amendments" ON amendments;
CREATE POLICY "anon_delete_amendments" ON amendments FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_amendments_project_id ON amendments(project_id);
CREATE INDEX IF NOT EXISTS idx_amendments_wo_id ON amendments(work_order_id);
