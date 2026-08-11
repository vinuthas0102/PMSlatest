/*
# Add Work Order Drawing Progress tracking

1. Overview
   This migration adds a `wo_drawing_progress` table that lets Site Engineers
   record category-wise drawing completion against approved Work Order drawing
   items (wo_sections where section_type = 'drawing'). Each update creates a
   NEW historical record so a full progress history is preserved.

2. New Table: wo_drawing_progress
   - id (uuid, primary key)
   - work_order_id (uuid, NOT NULL, references work_orders, cascade delete)
   - section_id (uuid, NOT NULL, references wo_sections, cascade delete)
   - entry_date (date, NOT NULL, default CURRENT_DATE)
   - cat1_completed (integer, NOT NULL, default 0) — completed Category 1 drawings
   - cat2_completed (integer, NOT NULL, default 0) — completed Category 2 drawings
   - cat3_completed (integer, NOT NULL, default 0) — completed Category 3 drawings
   - total_completed (integer, NOT NULL, default 0) — sum of cat1 + cat2 + cat3 (computed by app)
   - progress_pct (numeric, NOT NULL, default 0) — total_completed / total_drawings * 100 (computed by app)
   - remarks (text, nullable)
   - created_by (text, nullable) — Site Engineer name
   - created_role (text, nullable) — role of the engineer
   - created_at (timestamptz, default now())

3. Security
   - RLS enabled.
   - Single-tenant demo app (no Supabase Auth) → anon + authenticated full CRUD.
   - USING (true) / WITH CHECK (true) is acceptable because all data is intentionally shared.

4. Notes
   - No unique constraint: every update creates a new history record, per requirement.
   - Indexes on work_order_id and section_id for dashboard aggregation.
*/

CREATE TABLE IF NOT EXISTS wo_drawing_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id uuid NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  section_id uuid NOT NULL REFERENCES wo_sections(id) ON DELETE CASCADE,
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  cat1_completed integer NOT NULL DEFAULT 0,
  cat2_completed integer NOT NULL DEFAULT 0,
  cat3_completed integer NOT NULL DEFAULT 0,
  total_completed integer NOT NULL DEFAULT 0,
  progress_pct numeric NOT NULL DEFAULT 0,
  remarks text,
  created_by text,
  created_role text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE wo_drawing_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_wo_drawing_progress" ON wo_drawing_progress;
CREATE POLICY "anon_select_wo_drawing_progress" ON wo_drawing_progress FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_wo_drawing_progress" ON wo_drawing_progress;
CREATE POLICY "anon_insert_wo_drawing_progress" ON wo_drawing_progress FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_wo_drawing_progress" ON wo_drawing_progress;
CREATE POLICY "anon_update_wo_drawing_progress" ON wo_drawing_progress FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_wo_drawing_progress" ON wo_drawing_progress;
CREATE POLICY "anon_delete_wo_drawing_progress" ON wo_drawing_progress FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_wo_drawing_progress_wo_id ON wo_drawing_progress(work_order_id);
CREATE INDEX IF NOT EXISTS idx_wo_drawing_progress_section_id ON wo_drawing_progress(section_id);
