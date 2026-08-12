/*
# Secure cumulative Work Order payment recording

1. Purpose
   Replace browser-calculated payment totals with one database operation that
   records a payment, calculates the latest cumulative total, updates the
   Work Order and project paid amounts, and rejects overpayment atomically.

2. New Database Function
   - `record_work_order_payment`
   - Accepts a Work Order id, a new payment amount, an optional payment date,
     remarks, and the display name of the person recording it.
   - Locks the Work Order and its parent project while checking the latest
     payment total so simultaneous payments cannot bypass the limit.
   - Reads the approved Work Order value from `work_order_details`, falling
     back to the Work Order value when no detail row exists.
   - Inserts the payment entry with a server-calculated cumulative total.
   - Updates the Work Order and parent project paid amounts only after the
     payment has passed validation.

3. Security Changes
   - Direct client inserts into `payment_entries` are revoked; payment writes
     must use the validated function.
   - Direct client updates to the calculated `paid_amount` columns on
     `work_orders` and `projects` are revoked.
   - The function uses a fixed search path, exposes only execution to the
     existing shared app roles, and does not expose database error details to
     the interface.
   - Existing row-level policies remain unchanged because this is a shared,
     no-sign-in application.

4. Validation Rules
   - Payment amount must be greater than zero.
   - Cumulative payment must not exceed the approved Work Order value.
   - Invalid payments raise a controlled validation error and save nothing.

5. Data Safety
   - No tables, columns, or existing payment rows are deleted or changed.
   - Existing payment history is included in the server-side cumulative total;
     legacy stored Work Order totals are used as a lower-bound fallback.
*/

CREATE OR REPLACE FUNCTION public.record_work_order_payment(
  p_work_order_id uuid,
  p_amount numeric,
  p_payment_date date DEFAULT CURRENT_DATE,
  p_remarks text DEFAULT NULL,
  p_created_by text DEFAULT NULL
)
RETURNS public.payment_entries
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_work_order public.work_orders%ROWTYPE;
  v_approved_value numeric;
  v_current_paid numeric;
  v_cumulative_paid numeric;
  v_payment public.payment_entries;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'PAYMENT_AMOUNT_MUST_BE_GREATER_THAN_ZERO';
  END IF;

  SELECT *
  INTO v_work_order
  FROM public.work_orders
  WHERE id = p_work_order_id
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
      WHERE wod.work_order_id = p_work_order_id
      LIMIT 1
    ),
    v_work_order.project_value,
    0
  )
  INTO v_approved_value;

  SELECT GREATEST(
    COALESCE(SUM(pe.amount_paid), 0),
    COALESCE(v_work_order.paid_amount, 0)
  )
  INTO v_current_paid
  FROM public.payment_entries pe
  WHERE pe.work_order_id = p_work_order_id;

  v_cumulative_paid := v_current_paid + p_amount;

  IF v_cumulative_paid > v_approved_value THEN
    RAISE EXCEPTION 'PAYMENT_EXCEEDS_APPROVED_VALUE';
  END IF;

  INSERT INTO public.payment_entries (
    work_order_id,
    amount_paid,
    cumulative_paid,
    payment_date,
    remarks,
    created_by
  )
  VALUES (
    p_work_order_id,
    p_amount,
    v_cumulative_paid,
    COALESCE(p_payment_date, CURRENT_DATE),
    NULLIF(trim(p_remarks), ''),
    NULLIF(trim(p_created_by), '')
  )
  RETURNING * INTO v_payment;

  UPDATE public.work_orders
  SET paid_amount = v_cumulative_paid
  WHERE id = p_work_order_id;

  UPDATE public.projects
  SET paid_amount = COALESCE(paid_amount, 0) + p_amount
  WHERE id = v_work_order.project_id;

  RETURN v_payment;
END;
$$;

REVOKE ALL ON FUNCTION public.record_work_order_payment(uuid, numeric, date, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_work_order_payment(uuid, numeric, date, text, text) TO anon, authenticated;

REVOKE INSERT ON public.payment_entries FROM anon, authenticated;
REVOKE UPDATE (paid_amount) ON public.work_orders FROM anon, authenticated;
REVOKE UPDATE (paid_amount) ON public.projects FROM anon, authenticated;