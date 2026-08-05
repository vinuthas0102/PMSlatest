/*
  # Bound project values server-side

  1. Problem
     The maintenance form limits the budget and duration fields with HTML
     `min="0"` attributes only, and `handleSaveProject` parses them with
     parseFloat/parseInt without any range check. A crafted request could
     store a negative budget or an absurd duration, which then flows into
     every financial total and chart aggregation the dashboard computes.
     The `projects` table had no CHECK constraints at all.

  2. Changes
     Add CHECK constraints on `projects`:
     - `mbook_entry`, `billed_amount`, `paid_amount` must be >= 0
     - `duration_days`, `extension_days` must be between 0 and 36500 (100 years)
     - `target_pct`, `completed_pct` must be between 0 and 100
     - `qty_deviations`, `spec_deviations` must be >= 0
     All allow NULL where the column is nullable, so existing rows with
     unset values remain valid.

  3. Security
     Value invariants are now enforced by the database rather than the
     browser, so no request can store an out-of-range quantity. Verified
     against current data (budget min 560, percentages 20-100, billed min 525,
     paid min 380, durations null) - every existing row satisfies these
     bounds, so no data is modified or lost.
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'projects_mbook_entry_non_negative') THEN
    ALTER TABLE projects ADD CONSTRAINT projects_mbook_entry_non_negative
      CHECK (mbook_entry IS NULL OR mbook_entry >= 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'projects_billed_amount_non_negative') THEN
    ALTER TABLE projects ADD CONSTRAINT projects_billed_amount_non_negative
      CHECK (billed_amount IS NULL OR billed_amount >= 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'projects_paid_amount_non_negative') THEN
    ALTER TABLE projects ADD CONSTRAINT projects_paid_amount_non_negative
      CHECK (paid_amount IS NULL OR paid_amount >= 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'projects_duration_days_bounded') THEN
    ALTER TABLE projects ADD CONSTRAINT projects_duration_days_bounded
      CHECK (duration_days IS NULL OR (duration_days >= 0 AND duration_days <= 36500));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'projects_extension_days_bounded') THEN
    ALTER TABLE projects ADD CONSTRAINT projects_extension_days_bounded
      CHECK (extension_days IS NULL OR (extension_days >= 0 AND extension_days <= 36500));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'projects_target_pct_bounded') THEN
    ALTER TABLE projects ADD CONSTRAINT projects_target_pct_bounded
      CHECK (target_pct IS NULL OR (target_pct >= 0 AND target_pct <= 100));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'projects_completed_pct_bounded') THEN
    ALTER TABLE projects ADD CONSTRAINT projects_completed_pct_bounded
      CHECK (completed_pct IS NULL OR (completed_pct >= 0 AND completed_pct <= 100));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'projects_qty_deviations_non_negative') THEN
    ALTER TABLE projects ADD CONSTRAINT projects_qty_deviations_non_negative
      CHECK (qty_deviations IS NULL OR qty_deviations >= 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'projects_spec_deviations_non_negative') THEN
    ALTER TABLE projects ADD CONSTRAINT projects_spec_deviations_non_negative
      CHECK (spec_deviations IS NULL OR spec_deviations >= 0);
  END IF;
END $$;
