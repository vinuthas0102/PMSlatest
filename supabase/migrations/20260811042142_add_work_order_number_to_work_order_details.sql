/*
# Add work_order_number to work_order_details

1. Purpose
   The WO Header form needs a dedicated Work Order Number field so officers can
   record the official WO number issued by the client/authority, separate from
   the internal sequence number (seq_no). The start_date and end_date columns
   already exist on work_order_details, so no schema change is needed for those.

2. Changes
   - work_order_details: add column `work_order_number` (text, nullable).
     Nullable because existing rows do not have a value yet; the form will
     default to an empty string on the client side.

3. Security
   - No RLS policy changes. The table already has RLS enabled and existing
     policies cover the new column automatically.
*/

ALTER TABLE work_order_details
  ADD COLUMN IF NOT EXISTS work_order_number text;
