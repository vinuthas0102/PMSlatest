/*
# Add start and end dates to Work Order section items

1. Purpose
- Adds optional scheduling dates to every Work Order section item, including Quality Documents.
- Existing item records remain valid and keep their current values.

2. Modified Tables
- `wo_sections`
- Adds `start_date` (`date`, nullable): the planned start date for the section item.
- Adds `end_date` (`date`, nullable): the planned end or completion date for the section item.

3. Security
- No new tables or policies are introduced.
- Existing row-level security, table privileges, and client write restrictions remain unchanged.

4. Important Notes
- Both fields are intentionally optional so existing and newly created items can be saved without dates.
- The change is additive and does not remove or alter existing data.
*/

ALTER TABLE public.wo_sections
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS end_date date;