/*
# Enable real-time Work Order payment updates

1. Purpose
   Allow Work Order and dashboard financial displays to refresh when a payment
   is recorded from another open session.

2. Modified Tables
   - `payment_entries`: added to the `supabase_realtime` publication so new
     cumulative payment records generate change events.

3. Security
   - No rows, permissions, or RLS policies are changed.
   - Existing table access rules continue to control which data clients read.

4. Important Notes
   - The publication change is conditional and safe to re-run.
   - Existing payment history is preserved.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'payment_entries'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.payment_entries;
  END IF;
END $$;