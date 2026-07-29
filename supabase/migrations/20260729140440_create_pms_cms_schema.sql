/*
# Create PMS/CMS Dashboard Schema (single-tenant, no auth)

1. Overview
   This schema supports a Project Monitoring System / Contract Management System
   dashboard for Indian Government Infrastructure & Civil Works Departments.
   It models a 4-level hierarchy: Project -> Work Order -> Schedule -> Tracking.
   Specs can attach to any of the first three levels via a polymorphic reference.

2. New Tables
   - `projects`: Top-level civil works projects (seq 1.0.0, 2.0.0, ...).
     Columns: id, seq_no, title, code, manager, state, district, category,
     subcategory, target_pct, completed_pct, delay_status, qty_deviations,
     spec_deviations, extension_days, mbook_entry, billed_amount, paid_amount,
     start_date, end_date, created_at.
     Financial values are stored in INR Lakhs.
   - `work_orders`: Work orders under a project (seq 1.1.0, 1.2.0, ...).
     Same metric columns as projects, plus project_id FK.
   - `schedules`: Schedules under a work order (seq 1.1.1, 1.1.2, ...).
     Same metric columns, plus work_order_id FK.
   - `tracking_entries`: Tracking entries under a schedule (seq 1.1.1-TRK-01, ...).
     Columns: id, seq_no, schedule_id, title, site_officer, measurement_date,
     completion_tag, mbook_entry, billed_amount, paid_amount, created_at.
   - `specs`: Polymorphic spec items attached to a project, work order, schedule,
     or tracking entry. Columns: id, level (project/wo/schedule/tracking),
     parent_id, spec_code, description, unit, estimated_qty, executed_qty,
     rate, amount, measurement_date, has_attachment.

3. Security
   - RLS enabled on every table.
   - Single-tenant (no sign-in): policies allow anon + authenticated full CRUD
     because the dashboard data is intentionally shared/public.
*/

CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seq_no text NOT NULL,
  title text NOT NULL,
  code text NOT NULL,
  manager text NOT NULL,
  state text NOT NULL,
  district text NOT NULL,
  category text NOT NULL,
  subcategory text NOT NULL,
  target_pct numeric DEFAULT 0,
  completed_pct numeric DEFAULT 0,
  delay_status text NOT NULL DEFAULT 'On Time',
  qty_deviations integer DEFAULT 0,
  spec_deviations integer DEFAULT 0,
  extension_days integer DEFAULT 0,
  mbook_entry numeric DEFAULT 0,
  billed_amount numeric DEFAULT 0,
  paid_amount numeric DEFAULT 0,
  start_date date,
  end_date date,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_projects" ON projects;
CREATE POLICY "anon_select_projects" ON projects FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_projects" ON projects;
CREATE POLICY "anon_insert_projects" ON projects FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_projects" ON projects;
CREATE POLICY "anon_update_projects" ON projects FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_projects" ON projects;
CREATE POLICY "anon_delete_projects" ON projects FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS work_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  seq_no text NOT NULL,
  title text NOT NULL,
  code text NOT NULL,
  manager text NOT NULL,
  state text NOT NULL,
  district text NOT NULL,
  category text NOT NULL,
  subcategory text NOT NULL,
  target_pct numeric DEFAULT 0,
  completed_pct numeric DEFAULT 0,
  delay_status text NOT NULL DEFAULT 'On Time',
  qty_deviations integer DEFAULT 0,
  spec_deviations integer DEFAULT 0,
  extension_days integer DEFAULT 0,
  mbook_entry numeric DEFAULT 0,
  billed_amount numeric DEFAULT 0,
  paid_amount numeric DEFAULT 0,
  start_date date,
  end_date date,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_work_orders" ON work_orders;
CREATE POLICY "anon_select_work_orders" ON work_orders FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_work_orders" ON work_orders;
CREATE POLICY "anon_insert_work_orders" ON work_orders FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_work_orders" ON work_orders;
CREATE POLICY "anon_update_work_orders" ON work_orders FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_work_orders" ON work_orders;
CREATE POLICY "anon_delete_work_orders" ON work_orders FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id uuid NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  seq_no text NOT NULL,
  title text NOT NULL,
  code text NOT NULL,
  manager text NOT NULL,
  state text NOT NULL,
  district text NOT NULL,
  category text NOT NULL,
  subcategory text NOT NULL,
  target_pct numeric DEFAULT 0,
  completed_pct numeric DEFAULT 0,
  delay_status text NOT NULL DEFAULT 'On Time',
  qty_deviations integer DEFAULT 0,
  spec_deviations integer DEFAULT 0,
  extension_days integer DEFAULT 0,
  mbook_entry numeric DEFAULT 0,
  billed_amount numeric DEFAULT 0,
  paid_amount numeric DEFAULT 0,
  start_date date,
  end_date date,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_schedules" ON schedules;
CREATE POLICY "anon_select_schedules" ON schedules FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_schedules" ON schedules;
CREATE POLICY "anon_insert_schedules" ON schedules FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_schedules" ON schedules;
CREATE POLICY "anon_update_schedules" ON schedules FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_schedules" ON schedules;
CREATE POLICY "anon_delete_schedules" ON schedules FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS tracking_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id uuid NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
  seq_no text NOT NULL,
  title text NOT NULL,
  site_officer text NOT NULL,
  measurement_date date,
  completion_tag text NOT NULL DEFAULT 'Pending',
  mbook_entry numeric DEFAULT 0,
  billed_amount numeric DEFAULT 0,
  paid_amount numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tracking_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_tracking" ON tracking_entries;
CREATE POLICY "anon_select_tracking" ON tracking_entries FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_tracking" ON tracking_entries;
CREATE POLICY "anon_insert_tracking" ON tracking_entries FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_tracking" ON tracking_entries;
CREATE POLICY "anon_update_tracking" ON tracking_entries FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_tracking" ON tracking_entries;
CREATE POLICY "anon_delete_tracking" ON tracking_entries FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS specs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level text NOT NULL,
  parent_id uuid NOT NULL,
  spec_code text NOT NULL,
  description text NOT NULL,
  unit text NOT NULL,
  estimated_qty numeric DEFAULT 0,
  executed_qty numeric DEFAULT 0,
  rate numeric DEFAULT 0,
  amount numeric DEFAULT 0,
  measurement_date date,
  has_attachment boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE specs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_specs" ON specs;
CREATE POLICY "anon_select_specs" ON specs FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_specs" ON specs;
CREATE POLICY "anon_insert_specs" ON specs FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_specs" ON specs;
CREATE POLICY "anon_update_specs" ON specs FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_specs" ON specs;
CREATE POLICY "anon_delete_specs" ON specs FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_work_orders_project_id ON work_orders(project_id);
CREATE INDEX IF NOT EXISTS idx_schedules_work_order_id ON schedules(work_order_id);
CREATE INDEX IF NOT EXISTS idx_tracking_schedule_id ON tracking_entries(schedule_id);
CREATE INDEX IF NOT EXISTS idx_specs_parent ON specs(level, parent_id);
