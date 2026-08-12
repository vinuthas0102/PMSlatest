/*
# Add secure Work Order payment editing

1. Purpose
   Provide the Payments section with an approved way to correct an existing
   payment entry while keeping cumulative totals, Work Order totals, and project
   totals accurate.

2. New Database Function
   - `update_work_order_payment`
   - Accepts a payment entry id, replacement amount, payment date, and remarks.
   - Locks the related Work Order, project, and payment history while applying
     the change so two edits cannot produce conflicting totals.
   - Recalculates cumulative totals for every payment in the Work Order's
     payment sequence.
   - Updates the Work Order and project paid amounts using the payment total
     delta.

3. Modified Database Access
   - Direct client updates to `payment_entries` are revoked.
   - The new function is executable by the existing shared app roles because
     this application has no sign-in screen and intentionally uses shared data.
   - The function uses a fixed search path and validates all payment values on
     the server.

4. Validation and Data Safety
   - Replacement amounts must be greater than zero.
   - The recalculated total cannot exceed the approved Work Order value.
   - Missing payment entries and Work Orders are rejected without changes.
   - No tables, columns, or payment rows are deleted.
   - Existing payment order is preserved using payment date, creation time, and
     payment id as stable ordering keys.
*/

CREATE OR REPLACE FUNCTION public.update_work_order_payment(
  p_payment_id uuid,
  p_amount numeric,
  p_payment_date date,
  p_remarks text DEFAULT NULL
)
RETURNS public.payment_entries
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment public.payment_entries;
  v_work_order public.work_orders%ROWTYPE;
  v_project_paid numeric;
  v_approved_value numeric;
  v_old_total numeric;
  v_new_total numeric;
  v_running_total numeric := 0;
  v_row public.payment_entries;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'PAYMENT_AMOUNT_MUST_BE_GREATER_THAN_ZERO';
  END IF;

  SELECT pe.*
  INTO v_payment
  FROM public.payment_entries pe
  WHERE pe.id = p_payment_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'PAYMENT_NOT_FOUND';
  END IF;

  SELECT wo.*
  INTO v_work_order
  FROM public.work_orders wo
  WHERE wo.id = v_payment.work_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'WORK_ORDER_NOT_FOUND';
  END IF;

  PERFORM 1
  FROM public.projects
  WHERE id = v_work_order.project_id
  FOR UPDATE;

  SELECT COALESCE(
    (
      SELECT wod.wo_value
      FROM public.work_order_details wod
      WHERE wod.work_order_id = v_work_order.id
      LIMIT 1
    ),
    v_work_order.project_value,
    0
  )
  INTO v_approved_value;

  SELECT COALESCE(SUM(pe.amount_paid), 0)
  INTO v_old_total
  FROM public.payment_entries pe
  WHERE pe.work_order_id = v_work_order.id;

  v_new_total := v_old_total - v_payment.amount_paid + p_amount;

  IF v_new_total > v_approved_value THEN
    RAISE EXCEPTION 'PAYMENT_EXCEEDS_APPROVED_VALUE';
  END IF;

  UPDATE public.payment_entries
  SET amount_paid = p_amount,
      payment_date = COALESCE(p_payment_date, CURRENT_DATE),
      remarks = NULLIF(trim(p_remarks), '')
  WHERE id = p_payment_id;

  FOR v_row IN
    SELECT pe.*
    FROM public.payment_entries pe
    WHERE pe.work_order_id = v_work_order.id
    ORDER BY pe.payment_date, pe.created_at, pe.id
    FOR UPDATE
  LOOP
    v_running_total := v_running_total + v_row.amount_paid;
    UPDATE public.payment_entries
    SET cumulative_paid = v_running_total
    WHERE id = v_row.id;
  END LOOP;

  UPDATE public.work_orders
  SET paid_amount = v_new_total
  WHERE id = v_work_order.id;

  UPDATE public.projects
  SET paid_amount = COALESCE(paid_amount, 0) + (v_new_total - v_old_total)
  WHERE id = v_work_order.project_id
  RETURNING paid_amount INTO v_project_paid;

  SELECT *
  INTO v_payment
  FROM public.payment_entries
  WHERE id = p_payment_id;

  RETURN v_payment;
END;
$$;

REVOKE UPDATE ON public.payment_entries FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.update_work_order_payment(uuid, numeric, date, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_work_order_payment(uuid, numeric, date, text) TO anon, authenticated;