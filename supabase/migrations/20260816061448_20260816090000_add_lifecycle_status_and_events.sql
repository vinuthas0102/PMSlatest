/*
  # Add project / work-order lifecycle status and lifecycle events

  1. Purpose
     Projects and Work Orders currently only carry an approval status
     (draft / finalized). This migration adds a separate lifecycle status
     (active / cancelled / completed) so that admin and PM users can cancel,
     reinstate, and mark projects and work orders complete, with a full audit
     trail of every lifecycle action and the reason for it.

  2. New Columns
     - `projects.lifecycle_status` text NOT NULL DEFAULT 'active'
       CHECK IN ('active', 'cancelled', 'completed').
     - `work_order_details.lifecycle_status` text NOT NULL DEFAULT 'active'
       CHECK IN ('active', 'cancelled', 'completed').
     Existing rows default to 'active', so no data changes.

  3. New Table: `lifecycle_events`
     Records every cancel / reinstate / complete action.
     - id uuid primary key
     - target_type text NOT NULL CHECK IN ('project', 'work_order')
     - target_id uuid NOT NULL
     - action text NOT NULL CHECK IN ('cancel', 'reinstate', 'complete')
     - reason text NOT NULL
     - performed_by text
     - created_at timestamptz DEFAULT now()
     Index on (target_type, target_id) for per-entity history lookups.

  4. Security
     This is a shared, no-sign-in application, so the same shared-access model
     used by the rest of the schema applies:
     - RLS enabled on `lifecycle_events`.
     - SELECT, INSERT, UPDATE, DELETE policies allow anon + authenticated.
       The application gates who can perform lifecycle actions in the UI based
       on role permissions; the table is intentionally shared.
     - Grant UPDATE on the new `lifecycle_status` column for both
       `projects` and `work_order_details` to anon + authenticated so the
       lifecycle action handlers can set the status.
     - Grant SELECT, INSERT on `lifecycle_events` to anon + authenticated.

  5. Data Safety
     - No tables, columns, or rows are deleted.
     - Existing rows take the 'active' default; no data is rewritten.
*/

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS lifecycle_status text NOT NULL DEFAULT 'active'
  CHECK (lifecycle_status IN ('active', 'cancelled', 'completed'));

ALTER TABLE public.work_order_details
  ADD COLUMN IF NOT EXISTS lifecycle_status text NOT NULL DEFAULT 'active'
  CHECK (lifecycle_status IN ('active', 'cancelled', 'completed'));

CREATE TABLE IF NOT EXISTS public.lifecycle_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type text NOT NULL CHECK (target_type IN ('project', 'work_order')),
  target_id uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('cancel', 'reinstate', 'complete')),
  reason text NOT NULL,
  performed_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lifecycle_events_target
  ON public.lifecycle_events (target_type, target_id);

ALTER TABLE public.lifecycle_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_lifecycle_events" ON public.lifecycle_events;
CREATE POLICY "anon_select_lifecycle_events"
  ON public.lifecycle_events FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_lifecycle_events" ON public.lifecycle_events;
CREATE POLICY "anon_insert_lifecycle_events"
  ON public.lifecycle_events FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_lifecycle_events" ON public.lifecycle_events;
CREATE POLICY "anon_update_lifecycle_events"
  ON public.lifecycle_events FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_lifecycle_events" ON public.lifecycle_events;
CREATE POLICY "anon_delete_lifecycle_events"
  ON public.lifecycle_events FOR DELETE
  TO anon, authenticated USING (true);

GRANT UPDATE (lifecycle_status) ON public.projects TO anon, authenticated;
GRANT UPDATE (lifecycle_status) ON public.work_order_details TO anon, authenticated;
GRANT SELECT, INSERT ON public.lifecycle_events TO anon, authenticated;
