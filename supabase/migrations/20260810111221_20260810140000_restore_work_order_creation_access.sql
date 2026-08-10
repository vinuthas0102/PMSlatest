/* Restore the create path for Agency / Work Order records.

1. Purpose
- Re-enable creation of the main work-order row used by the Agency / Work Order form.

2. Access changes
- Grant INSERT on `work_orders` to the existing anon and authenticated application roles.
- Add an INSERT policy for those roles.

3. Safety
- Work orders remain read-only for updates and deletes through the public API.
- Agency details already have the insert access required by the create form.
- No existing rows are modified or removed.
*/

GRANT INSERT ON work_orders TO anon, authenticated;

DROP POLICY IF EXISTS "anon_insert_work_orders" ON work_orders;
CREATE POLICY "anon_insert_work_orders" ON work_orders FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);