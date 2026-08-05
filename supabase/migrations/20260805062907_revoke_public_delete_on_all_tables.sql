/*
  # Remove public DELETE access from every table

  1. Problem
     Every table carried a DELETE policy with a `true` predicate granted to
     `anon` and `authenticated`, plus a table-level DELETE grant. The
     application never deletes any row (no `.delete()` call exists in the
     source), so this was pure exposure: any visitor holding the public anon
     key could wipe all project data, cascading through work orders,
     schedules and tracking entries.

  2. Changes
     - Drop `anon_delete_projects`, `anon_delete_work_orders`,
       `anon_delete_schedules`, `anon_delete_tracking`, `anon_delete_specs`.
     - Revoke DELETE on all five tables from `anon` and `authenticated`.

  3. Security
     Deletion becomes impossible through the Data API. RLS remains enabled on
     every table. No existing application feature uses deletion, so nothing
     breaks. No data is removed by this migration.
*/

DROP POLICY IF EXISTS "anon_delete_projects" ON projects;
DROP POLICY IF EXISTS "anon_delete_work_orders" ON work_orders;
DROP POLICY IF EXISTS "anon_delete_schedules" ON schedules;
DROP POLICY IF EXISTS "anon_delete_tracking" ON tracking_entries;
DROP POLICY IF EXISTS "anon_delete_specs" ON specs;

REVOKE DELETE ON projects FROM anon, authenticated;
REVOKE DELETE ON work_orders FROM anon, authenticated;
REVOKE DELETE ON schedules FROM anon, authenticated;
REVOKE DELETE ON tracking_entries FROM anon, authenticated;
REVOKE DELETE ON specs FROM anon, authenticated;
