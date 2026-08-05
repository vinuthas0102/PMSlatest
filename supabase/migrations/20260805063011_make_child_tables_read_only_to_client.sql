/*
  # Make work orders, schedules, tracking entries and specs read-only to the client

  1. Problem
     These four tables carried INSERT and UPDATE policies with `true`
     predicates for `anon` and `authenticated`, together with table-level
     grants covering every column. The application only ever reads them
     (`select('*')` in the dashboard data hook), so any visitor with the
     public anon key could fabricate work orders, rewrite completion
     percentages and billed/paid amounts, or inject unlimited spec rows.

  2. Changes
     - Drop the INSERT and UPDATE policies on `work_orders`, `schedules`,
       `tracking_entries` and `specs`.
     - Revoke INSERT and UPDATE on those tables from `anon` and
       `authenticated`.
     - SELECT policies and grants are deliberately left untouched: the
       dashboard is intentionally publicly readable.

  3. Security
     These tables become read-only through the Data API, matching exactly
     what the application does with them. No data is modified or removed.
*/

DROP POLICY IF EXISTS "anon_insert_work_orders" ON work_orders;
DROP POLICY IF EXISTS "anon_update_work_orders" ON work_orders;
DROP POLICY IF EXISTS "anon_insert_schedules" ON schedules;
DROP POLICY IF EXISTS "anon_update_schedules" ON schedules;
DROP POLICY IF EXISTS "anon_insert_tracking" ON tracking_entries;
DROP POLICY IF EXISTS "anon_update_tracking" ON tracking_entries;
DROP POLICY IF EXISTS "anon_insert_specs" ON specs;
DROP POLICY IF EXISTS "anon_update_specs" ON specs;

REVOKE INSERT, UPDATE ON work_orders FROM anon, authenticated;
REVOKE INSERT, UPDATE ON schedules FROM anon, authenticated;
REVOKE INSERT, UPDATE ON tracking_entries FROM anon, authenticated;
REVOKE INSERT, UPDATE ON specs FROM anon, authenticated;
