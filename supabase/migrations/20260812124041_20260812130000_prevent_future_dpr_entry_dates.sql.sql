/*
# Prevent future-dated DPR progress entries

1. Overview
   Site Engineers can now pick a past Date of Record when entering DPR
   (Daily Progress Report) quantities for Category 1, Category 2, and
   Category 3 drawings, or for general section progress. This lets them
   back-enter progress for older projects. Future dates must never be
   allowed, so this migration adds a CHECK constraint on both progress
   tables that rejects any entry_date later than the current date.

2. Modified tables
   - `wo_drawing_progress`: add CHECK (entry_date <= CURRENT_DATE).
   - `wo_section_progress`: add CHECK (entry_date <= CURRENT_DATE).

3. Data safety
   - No columns added, renamed, or dropped.
   - No data changes; existing rows already use CURRENT_DATE or earlier.
   - Constraints are added only if they do not already exist (idempotent).

4. Security
   - No policy or role changes.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'wo_drawing_progress_entry_date_not_future'
  ) THEN
    ALTER TABLE wo_drawing_progress
      ADD CONSTRAINT wo_drawing_progress_entry_date_not_future
      CHECK (entry_date <= CURRENT_DATE);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'wo_section_progress_entry_date_not_future'
  ) THEN
    ALTER TABLE wo_section_progress
      ADD CONSTRAINT wo_section_progress_entry_date_not_future
      CHECK (entry_date <= CURRENT_DATE);
  END IF;
END $$;
