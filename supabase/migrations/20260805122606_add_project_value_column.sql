/*
  # Add project_value column to projects

  1. New Columns
     - `projects.project_value` (numeric, NOT NULL, default 0, in INR Lakhs).
       This is the total sanctioned value of the project. The existing
       `mbook_entry` column (the MBook / budgeted value) is a figure derived
       from this base, so project_value is the parent financial field.

  2. Security
     - GRANT UPDATE (project_value) to anon and authenticated so the
       Project Maintenance form can edit it, matching the column-level
       grant pattern established in the earlier
       "restrict_projects_writes_to_form_columns" migration.
     - GRANT INSERT (project_value) for the create path.

  3. Data
     - Backfill existing rows to 0 so nothing breaks. No existing data
       is modified or lost — only the new column is initialised.
*/

ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_value numeric NOT NULL DEFAULT 0;

UPDATE projects SET project_value = 0 WHERE project_value IS NULL;

GRANT UPDATE (project_value) ON projects TO anon, authenticated;
GRANT INSERT (project_value) ON projects TO anon, authenticated;
