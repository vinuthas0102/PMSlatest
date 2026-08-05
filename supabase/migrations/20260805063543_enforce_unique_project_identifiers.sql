/*
  # Enforce unique project identifiers

  1. Problem
     `projects.code` and `projects.seq_no` are the identifiers the dashboard
     uses to name and order projects, but neither had a uniqueness constraint.
     The create path derives the next identifier client-side from its cached
     copy of the data (`maxSeq + 1`), which is a read-then-write, not an atomic
     claim: two people creating a project at the same moment both compute the
     same next code and both inserts succeed, producing duplicate identifiers.

  2. Changes
     - Add a UNIQUE constraint on `projects.code`.
     - Add a UNIQUE constraint on `projects.seq_no`.

  3. Security
     The database now arbitrates the identifier claim, so a concurrent
     duplicate is rejected rather than stored. Combined with the previous
     migration (which removed client UPDATE on both columns) project identity
     can no longer be rewritten or collided. Existing data already holds 14
     distinct codes and 14 distinct seq_no values across 14 rows, so both
     constraints apply without conflict and no data is modified.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'projects_code_key'
  ) THEN
    ALTER TABLE projects ADD CONSTRAINT projects_code_key UNIQUE (code);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'projects_seq_no_key'
  ) THEN
    ALTER TABLE projects ADD CONSTRAINT projects_seq_no_key UNIQUE (seq_no);
  END IF;
END $$;
