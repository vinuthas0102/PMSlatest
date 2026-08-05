/*
  # Restrict client writes on projects to the maintenance form columns

  1. Problem
     `projects` had table-level INSERT and UPDATE granted to `anon` and
     `authenticated`, which in Postgres covers EVERY column. Row-level
     policies cannot narrow this. The Project Maintenance form only edits
     eleven descriptive columns, but any caller could rewrite:
       - completed_pct / target_pct   -> falsify reported progress
       - billed_amount / paid_amount  -> falsify financial totals
       - delay_status                 -> clear delay warnings on late projects
       - qty_deviations / spec_deviations / extension_days -> erase audit signals
       - seq_no / code                -> rewrite project identity
       - title                        -> rename a project the form marks read-only

  2. Changes
     - Revoke table-level INSERT and UPDATE on `projects`.
     - Re-grant UPDATE only on the columns the edit form actually changes:
       description, state, district, category, subcategory, start_date,
       duration_days, mbook_entry, manager, remarks.
       `title` is deliberately excluded: the edit form presents it as
       read-only, so that promise is now enforced by the database.
     - Re-grant INSERT on those columns plus title, seq_no and code, which the
       create path legitimately sets. `delay_status` is excluded from INSERT
       too; new rows take its column default of 'On Time'.

  3. Security
     Derived progress, financial, deviation and identity columns become
     unwritable through the Data API while the maintenance screen keeps
     working exactly as before. SELECT is untouched, so no existing
     `select('*')` query is affected. No data is modified.
*/

REVOKE INSERT, UPDATE ON projects FROM anon, authenticated;

GRANT UPDATE (
  description,
  state,
  district,
  category,
  subcategory,
  start_date,
  duration_days,
  mbook_entry,
  manager,
  remarks
) ON projects TO anon, authenticated;

GRANT INSERT (
  seq_no,
  code,
  title,
  description,
  state,
  district,
  category,
  subcategory,
  start_date,
  duration_days,
  mbook_entry,
  manager,
  remarks
) ON projects TO anon, authenticated;
