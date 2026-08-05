/*
  # Sync tracking updates back to the parent project

  1. Purpose
     `project_tracking_updates` is an append-only audit log. When an officer
     records a tracking update, the parent `projects` row should reflect the
     change: a delay update sets `delay_status`, and quantity / spec deviations
     bump the deviation counters. The client cannot write those columns directly
     (they were locked down for safety), so the write-back happens here, in a
     trigger function that runs with elevated privileges.

  2. Approach
     - A `SECURITY DEFINER` function `handle_tracking_update_insert()` runs on
       INSERT on `project_tracking_updates`.
     - It inspects `NEW.tracking_type`:
         'delay'    -> projects.delay_status = NEW.deviation_value
         'quantity' -> projects.qty_deviations = projects.qty_deviations + 1
         'spec'     -> projects.spec_deviations = projects.spec_deviations + 1
         'delivery' / 'price' -> logged only, no column to update
     - The function is owned by the postgres role, so it bypasses the column
       privileges that block client writes on delay_status / deviation counters.
     - A CHECK guards the delay value against the known status set so a bad
       insert cannot corrupt delay_status.

  3. Security
     - The trigger function is SECURITY DEFINER and owned by `postgres`. It only
       ever updates the project row that the new tracking row references, so it
       cannot be used to touch arbitrary projects.
     - No new grants are given to anon / authenticated — they still cannot write
       these columns directly; only the trigger can.
     - The function's search_path is pinned to `public` to avoid schema
       resolution surprises.
*/

CREATE OR REPLACE FUNCTION public.handle_tracking_update_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.tracking_type = 'delay' THEN
    IF NEW.deviation_value NOT IN ('On Time', 'Delayed - Warning', 'Delayed - Serious', 'Delayed - Critical') THEN
      RAISE EXCEPTION 'Invalid delay status value: %', NEW.deviation_value;
    END IF;
    UPDATE projects
       SET delay_status = NEW.deviation_value
     WHERE id = NEW.project_id;
  ELSIF NEW.tracking_type = 'quantity' THEN
    UPDATE projects
       SET qty_deviations = qty_deviations + 1
     WHERE id = NEW.project_id;
  ELSIF NEW.tracking_type = 'spec' THEN
    UPDATE projects
       SET spec_deviations = spec_deviations + 1
     WHERE id = NEW.project_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_tracking_update_sync ON project_tracking_updates;
CREATE TRIGGER trg_tracking_update_sync
  AFTER INSERT ON project_tracking_updates
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_tracking_update_insert();
