/*
# Create drawing_status_entries table

1. Overview
   This migration adds a `drawing_status_entries` table that lets Site Engineers
   log Drawing Status updates per project, work order, and discipline. Each
   update is stored as a NEW historical record (no replacement of prior entries),
   so a full progress history is preserved.

2. New Table: drawing_status_entries
   - id (uuid, primary key)
   - project_id (uuid, NOT NULL, references projects)
   - work_order_id (uuid, references work_orders, nullable)
   - discipline (text, NOT NULL) — e.g. Civil, Mechanical, Electrical, Vessels/Piping
   - entry_date (date, NOT NULL, default CURRENT_DATE)
   - cat1_total (integer, default 0) — Category 1 drawings
   - cat2_total (integer, default 0) — Category 2 drawings
   - cat3_total (integer, default 0) — Category 3 drawings
   - code_value (numeric, default 0) — related code value for the discipline
   - total_drawings (integer, default 0) — sum of cat1 + cat2 + cat3 (computed by app)
   - completed_drawings (integer, default 0) — drawings completed/updated so far
   - drawing_progress_pct (numeric, default 0) — completed_drawings / total_drawings * 100
   - remarks (text, nullable)
   - created_by (text, nullable) — Site Engineer name
   - created_at (timestamptz, default now())

3. Security
   - RLS enabled.
   - Single-tenant demo app (no Supabase Auth) → anon + authenticated full CRUD.
   - USING (true) / WITH CHECK (true) is acceptable because all data is intentionally shared.

4. Notes
   - No unique constraint: every update creates a new history record, per requirement.
   - Indexes on project_id, work_order_id, and discipline for dashboard aggregation.
*/

CREATE TABLE IF NOT EXISTS drawing_status_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  work_order_id uuid REFERENCES work_orders(id) ON DELETE CASCADE,
  discipline text NOT NULL DEFAULT 'Civil',
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  cat1_total integer NOT NULL DEFAULT 0,
  cat2_total integer NOT NULL DEFAULT 0,
  cat3_total integer NOT NULL DEFAULT 0,
  code_value numeric NOT NULL DEFAULT 0,
  total_drawings integer NOT NULL DEFAULT 0,
  completed_drawings integer NOT NULL DEFAULT 0,
  drawing_progress_pct numeric NOT NULL DEFAULT 0,
  remarks text,
  created_by text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE drawing_status_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_drawing_status" ON drawing_status_entries;
CREATE POLICY "anon_select_drawing_status" ON drawing_status_entries FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_drawing_status" ON drawing_status_entries;
CREATE POLICY "anon_insert_drawing_status" ON drawing_status_entries FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_drawing_status" ON drawing_status_entries;
CREATE POLICY "anon_update_drawing_status" ON drawing_status_entries FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_drawing_status" ON drawing_status_entries;
CREATE POLICY "anon_delete_drawing_status" ON drawing_status_entries FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_drawing_status_project_id ON drawing_status_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_drawing_status_wo_id ON drawing_status_entries(work_order_id);
CREATE INDEX IF NOT EXISTS idx_drawing_status_discipline ON drawing_status_entries(discipline);
