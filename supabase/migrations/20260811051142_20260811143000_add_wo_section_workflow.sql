/*
# Add WO section workflow records

1. New columns on `wo_sections`
- `approval_status`: Draft, Pending Approval, or Approved.
- `defined_by`, `submitted_by`, `approved_by`, `approved_role`: audit identity fields.
- `submitted_at`, `approved_at`: workflow timestamps.
- `approval_remarks`: approval or return notes.

2. New tables
- `wo_section_progress`: site engineer updates against any WO item, preserving planned and actual values separately.
- `wo_section_documents`: Quality document definitions and site engineer upload/review metadata.
- `wo_section_activity`: reverse-chronological audit history for item maintenance, approval, progress, and document actions.

3. Security
- Enable row-level security on all new tables.
- This application uses a shared single-tenant workspace with its existing demo role layer, so anon and authenticated clients can read and write the records. Role-specific actions are enforced in the application UI and recorded with the acting user.

4. Data safety
- Existing WO section rows are preserved.
- Existing columns remain unchanged.
- New fields default to Draft so current items remain editable until approved.
*/

ALTER TABLE wo_sections
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS defined_by text,
  ADD COLUMN IF NOT EXISTS submitted_by text,
  ADD COLUMN IF NOT EXISTS approved_by text,
  ADD COLUMN IF NOT EXISTS approved_role text,
  ADD COLUMN IF NOT EXISTS submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS approval_remarks text;

CREATE TABLE IF NOT EXISTS wo_section_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id uuid NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  section_id uuid NOT NULL REFERENCES wo_sections(id) ON DELETE CASCADE,
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  progress_value numeric NOT NULL DEFAULT 0,
  progress_unit text,
  status text NOT NULL DEFAULT 'in_progress',
  remarks text,
  created_by text,
  created_role text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS wo_section_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id uuid NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  section_id uuid NOT NULL REFERENCES wo_sections(id) ON DELETE CASCADE,
  document_name text NOT NULL,
  description text,
  is_mandatory boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'not_submitted',
  file_name text,
  storage_path text,
  uploaded_by text,
  uploaded_at timestamptz,
  reviewed_by text,
  reviewed_at timestamptz,
  review_remarks text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS wo_section_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id uuid NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  section_id uuid NOT NULL REFERENCES wo_sections(id) ON DELETE CASCADE,
  action text NOT NULL,
  actor_name text,
  actor_role text,
  details text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE wo_section_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE wo_section_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE wo_section_activity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_wo_section_progress" ON wo_section_progress;
CREATE POLICY "anon_select_wo_section_progress" ON wo_section_progress FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_wo_section_progress" ON wo_section_progress;
CREATE POLICY "anon_insert_wo_section_progress" ON wo_section_progress FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_wo_section_progress" ON wo_section_progress;
CREATE POLICY "anon_update_wo_section_progress" ON wo_section_progress FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_wo_section_progress" ON wo_section_progress;
CREATE POLICY "anon_delete_wo_section_progress" ON wo_section_progress FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_wo_section_documents" ON wo_section_documents;
CREATE POLICY "anon_select_wo_section_documents" ON wo_section_documents FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_wo_section_documents" ON wo_section_documents;
CREATE POLICY "anon_insert_wo_section_documents" ON wo_section_documents FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_wo_section_documents" ON wo_section_documents;
CREATE POLICY "anon_update_wo_section_documents" ON wo_section_documents FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_wo_section_documents" ON wo_section_documents;
CREATE POLICY "anon_delete_wo_section_documents" ON wo_section_documents FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_wo_section_activity" ON wo_section_activity;
CREATE POLICY "anon_select_wo_section_activity" ON wo_section_activity FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_wo_section_activity" ON wo_section_activity;
CREATE POLICY "anon_insert_wo_section_activity" ON wo_section_activity FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_wo_section_activity" ON wo_section_activity;
CREATE POLICY "anon_update_wo_section_activity" ON wo_section_activity FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_wo_section_activity" ON wo_section_activity;
CREATE POLICY "anon_delete_wo_section_activity" ON wo_section_activity FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_wo_section_progress_section_id ON wo_section_progress(section_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wo_section_documents_section_id ON wo_section_documents(section_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wo_section_activity_section_id ON wo_section_activity(section_id, created_at DESC);
