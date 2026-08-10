/*
# Enforce one header per work order

1. Purpose
- The Work Order Header screen stores one agency/header record for each work order.
- Duplicate header rows had accumulated for the Bengaluru Outer Ring Road Flyover project, causing the screen to read one row while saves updated a different row.

2. Data cleanup
- Duplicate rows for work order 1.1.0 were removed before this constraint was applied.
- The existing original header row and the separate 1.2.0 work order header were preserved.

3. Modified tables
- `work_order_details`
- Adds a unique constraint on `work_order_id`, ensuring each work order has at most one header row.

4. Security
- No RLS policies or client privileges are changed.
- Existing public/shared single-tenant access remains unchanged.

5. Important notes
- The constraint supports deterministic upsert behavior from the Work Order Header screen.
- This migration does not remove columns, change column types, or alter existing valid header data.
*/

ALTER TABLE public.work_order_details
  ADD CONSTRAINT work_order_details_work_order_id_key UNIQUE (work_order_id);