/*
# Add project header fields for Project Maintenance screen

1. Overview
   The Project Maintenance screen needs to store additional project header
   information that is editable by the user: a free-form description, remarks,
   and project duration in days. These columns are added to the existing
   `projects` table. No data is lost — all new columns are nullable / have
   safe defaults so existing rows remain valid.

2. Modified Tables
   - `projects`
     - `description` (text, nullable) — free-form project description shown
       and editable in the Project Maintenance header form.
     - `remarks` (text, nullable) — project remarks / notes field shown and
       editable in the header form.
     - `duration_days` (integer, nullable) — project duration in days,
       editable in the header form. Used alongside start_date to derive an
       end date when needed.

3. Security
   - No new tables. RLS is already enabled on `projects` and existing
     anon+authenticated CRUD policies remain in effect. No policy changes.
*/

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS remarks text,
  ADD COLUMN IF NOT EXISTS duration_days integer;
