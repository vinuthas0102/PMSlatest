/*
# Enable real-time drawing status updates

1. Purpose
   Allow the dashboard and project-level Drawing Status section to receive
   immediate notifications when a Work Order drawing progress entry is saved.

2. Modified Tables
   - `wo_drawing_progress`: added to the `supabase_realtime` publication.
     This table contains the Site Engineer's category-wise drawing progress
     records and their calculated completion percentage.
   - `wo_sections`: added to the `supabase_realtime` publication.
     This table contains the approved drawing item definitions and category
     totals used by project-level aggregation.

3. Security
   - No RLS policies, permissions, or stored data are changed.
   - Existing table RLS remains responsible for deciding which rows clients
     can read.

4. Important Notes
   - The publication additions are conditional and safe to re-run.
   - Existing drawing history is preserved; this only enables change events.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'wo_drawing_progress'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.wo_drawing_progress;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'wo_sections'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.wo_sections;
  END IF;
END $$;