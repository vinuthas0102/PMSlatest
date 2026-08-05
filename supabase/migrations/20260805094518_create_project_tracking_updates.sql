/*
# Create project_tracking_updates table

1. Purpose
   Stores per-project tracking maintenance updates entered by officers from the
   maintenance screen. Each row captures one update against a project for one of
   five tracking types: delay, quantity deviation, delivery deviation, spec
   deviation, and price escalation. This is an append-only log — rows can be read
   and inserted by the client, but never updated or deleted.

2. New Tables
   - `project_tracking_updates`
     - `id` (uuid, primary key, auto-generated)
     - `project_id` (uuid, foreign key to projects.id, ON DELETE CASCADE)
     - `tracking_type` (text, one of: 'delay', 'quantity', 'delivery', 'spec', 'price')
     - `deviation_value` (text — delay-status label for delay type, percentage label for others)
     - `officer_name` (text, name of the officer entering the update)
     - `remarks` (text, rich-text remarks / reason for the update)
     - `created_at` (timestamptz, defaults to now())

3. Indexes
   - `idx_tracking_updates_project_id` on `project_id` for fast per-project lookups
   - `idx_tracking_updates_project_type` on `(project_id, tracking_type)` for filtered history

4. Security
   - Enable RLS on `project_tracking_updates`.
   - This is a single-tenant, no-auth app (the dashboard has no sign-in screen),
     so policies are scoped to `anon, authenticated` so the anon-key frontend can
     read all rows and append new rows.
   - SELECT: allow anon + authenticated to read all rows (USING true) — data is
     intentionally shared across the dashboard.
   - INSERT: allow anon + authenticated to insert (WITH CHECK true).
   - No UPDATE or DELETE policies — the table is append-only. This is enforced by
     the absence of those policies; RLS denies by default.

5. Important Notes
   - The table is append-only by design: once an update is recorded it cannot be
     modified or removed from the client, preserving the audit trail.
   - `tracking_type` is constrained to the five known values via a CHECK constraint.
*/

CREATE TABLE IF NOT EXISTS project_tracking_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  tracking_type text NOT NULL CHECK (tracking_type IN ('delay', 'quantity', 'delivery', 'spec', 'price')),
  deviation_value text NOT NULL,
  officer_name text NOT NULL DEFAULT '',
  remarks text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tracking_updates_project_id
  ON project_tracking_updates(project_id);

CREATE INDEX IF NOT EXISTS idx_tracking_updates_project_type
  ON project_tracking_updates(project_id, tracking_type);

ALTER TABLE project_tracking_updates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_tracking_updates" ON project_tracking_updates;
CREATE POLICY "anon_select_tracking_updates"
  ON project_tracking_updates FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_tracking_updates" ON project_tracking_updates;
CREATE POLICY "anon_insert_tracking_updates"
  ON project_tracking_updates FOR INSERT
  TO anon, authenticated WITH CHECK (true);
