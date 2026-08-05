/*
  # Constrain delay_status to the four values the dashboard understands

  1. Problem
     `delay_status` is `NOT NULL DEFAULT 'On Time'` with no CHECK constraint,
     so any string could be stored. The dashboard matches only four values
     ('On Time', 'Delayed - Warning', 'Delayed - Serious',
     'Delayed - Critical') and falls through silently for anything else, so a
     row with an unrecognised status disappears from every delay filter and
     chart bucket instead of being surfaced.

  2. Changes
     - Add a CHECK constraint on `projects.delay_status`, `work_orders.delay_status`
       and `schedules.delay_status` restricting each to those four values.

  3. Security
     Closes the integrity gap on a column with a fixed domain, so no write can
     hide a project from the delay reporting by giving it an unknown status.
     Verified against current data: every existing row in all three tables
     already holds one of the four values, so no data is modified or lost.
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'projects_delay_status_known') THEN
    ALTER TABLE projects ADD CONSTRAINT projects_delay_status_known
      CHECK (delay_status IN ('On Time', 'Delayed - Warning', 'Delayed - Serious', 'Delayed - Critical'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'work_orders_delay_status_known') THEN
    ALTER TABLE work_orders ADD CONSTRAINT work_orders_delay_status_known
      CHECK (delay_status IN ('On Time', 'Delayed - Warning', 'Delayed - Serious', 'Delayed - Critical'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'schedules_delay_status_known') THEN
    ALTER TABLE schedules ADD CONSTRAINT schedules_delay_status_known
      CHECK (delay_status IN ('On Time', 'Delayed - Warning', 'Delayed - Serious', 'Delayed - Critical'));
  END IF;
END $$;
