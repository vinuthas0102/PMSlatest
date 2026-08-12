ALTER TABLE public.payment_entries
  ADD COLUMN IF NOT EXISTS section_id uuid REFERENCES public.wo_sections(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS vendor_invoice_number text,
  ADD COLUMN IF NOT EXISTS vendor_invoice_date date,
  ADD COLUMN IF NOT EXISTS voucher_number text,
  ADD COLUMN IF NOT EXISTS voucher_date date;

CREATE INDEX IF NOT EXISTS payment_entries_section_id_idx ON public.payment_entries(section_id);

CREATE OR REPLACE FUNCTION public.record_section_payment(
  p_section_id uuid,
  p_amount numeric,
  p_payment_date date DEFAULT CURRENT_DATE,
  p_vendor_invoice_number text DEFAULT NULL,
  p_vendor_invoice_date date DEFAULT NULL,
  p_voucher_number text DEFAULT NULL,
  p_voucher_date date DEFAULT NULL,
  p_remarks text DEFAULT NULL,
  p_created_by text DEFAULT NULL
)
RETURNS public.payment_entries
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_section public.wo_sections%ROWTYPE;
  v_work_order public.work_orders%ROWTYPE;
  v_current_section_paid numeric;
  v_current_wo_paid numeric;
  v_section_cumulative numeric;
  v_wo_cumulative numeric;
  v_payment public.payment_entries;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'PAYMENT_AMOUNT_MUST_BE_GREATER_THAN_ZERO';
  END IF;

  SELECT * INTO v_section
  FROM public.wo_sections
  WHERE id = p_section_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'SECTION_NOT_FOUND';
  END IF;

  SELECT * INTO v_work_order
  FROM public.work_orders
  WHERE id = v_section.work_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'WORK_ORDER_NOT_FOUND';
  END IF;

  PERFORM 1 FROM public.projects WHERE id = v_work_order.project_id FOR UPDATE;

  SELECT COALESCE(SUM(pe.amount_paid), 0)
  INTO v_current_section_paid
  FROM public.payment_entries pe
  WHERE pe.section_id = p_section_id;

  IF v_current_section_paid + p_amount > COALESCE(v_section.value, 0) THEN
    RAISE EXCEPTION 'PAYMENT_EXCEEDS_SECTION_VALUE';
  END IF;

  SELECT GREATEST(
    COALESCE(SUM(pe.amount_paid), 0),
    COALESCE(v_work_order.paid_amount, 0)
  )
  INTO v_current_wo_paid
  FROM public.payment_entries pe
  WHERE pe.work_order_id = v_work_order.id;

  v_section_cumulative := v_current_section_paid + p_amount;
  v_wo_cumulative := v_current_wo_paid + p_amount;

  IF v_wo_cumulative > COALESCE((SELECT wod.wo_value FROM public.work_order_details wod WHERE wod.work_order_id = v_work_order.id LIMIT 1), v_work_order.project_value, 0) THEN
    RAISE EXCEPTION 'PAYMENT_EXCEEDS_APPROVED_VALUE';
  END IF;

  INSERT INTO public.payment_entries (
    work_order_id, section_id, amount_paid, cumulative_paid, payment_date,
    vendor_invoice_number, vendor_invoice_date, voucher_number, voucher_date,
    remarks, created_by
  ) VALUES (
    v_work_order.id, p_section_id, p_amount, v_section_cumulative,
    COALESCE(p_payment_date, CURRENT_DATE), NULLIF(trim(p_vendor_invoice_number), ''),
    p_vendor_invoice_date, NULLIF(trim(p_voucher_number), ''), p_voucher_date,
    NULLIF(trim(p_remarks), ''), NULLIF(trim(p_created_by), '')
  ) RETURNING * INTO v_payment;

  UPDATE public.wo_sections SET value = value WHERE id = p_section_id;
  UPDATE public.work_orders SET paid_amount = v_wo_cumulative WHERE id = v_work_order.id;
  UPDATE public.projects SET paid_amount = COALESCE(paid_amount, 0) + p_amount WHERE id = v_work_order.project_id;

  RETURN v_payment;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_section_payment(
  p_payment_id uuid,
  p_amount numeric,
  p_payment_date date,
  p_vendor_invoice_number text DEFAULT NULL,
  p_vendor_invoice_date date DEFAULT NULL,
  p_voucher_number text DEFAULT NULL,
  p_voucher_date date DEFAULT NULL,
  p_remarks text DEFAULT NULL
)
RETURNS public.payment_entries
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_payment public.payment_entries;
  v_section public.wo_sections%ROWTYPE;
  v_work_order public.work_orders%ROWTYPE;
  v_old_total numeric;
  v_new_total numeric;
  v_section_old_total numeric;
  v_section_new_total numeric;
  v_running_total numeric := 0;
  v_row public.payment_entries;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'PAYMENT_AMOUNT_MUST_BE_GREATER_THAN_ZERO';
  END IF;

  SELECT * INTO v_payment FROM public.payment_entries WHERE id = p_payment_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'PAYMENT_NOT_FOUND'; END IF;
  IF v_payment.section_id IS NULL THEN RAISE EXCEPTION 'SECTION_PAYMENT_REQUIRED'; END IF;

  SELECT * INTO v_section FROM public.wo_sections WHERE id = v_payment.section_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'SECTION_NOT_FOUND'; END IF;
  SELECT * INTO v_work_order FROM public.work_orders WHERE id = v_payment.work_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'WORK_ORDER_NOT_FOUND'; END IF;
  PERFORM 1 FROM public.projects WHERE id = v_work_order.project_id FOR UPDATE;

  SELECT COALESCE(SUM(pe.amount_paid), 0) INTO v_old_total
  FROM public.payment_entries pe WHERE pe.work_order_id = v_work_order.id;
  SELECT COALESCE(SUM(pe.amount_paid), 0) INTO v_section_old_total
  FROM public.payment_entries pe WHERE pe.section_id = v_payment.section_id;

  v_new_total := v_old_total - v_payment.amount_paid + p_amount;
  v_section_new_total := v_section_old_total - v_payment.amount_paid + p_amount;

  IF v_section_new_total > COALESCE(v_section.value, 0) THEN RAISE EXCEPTION 'PAYMENT_EXCEEDS_SECTION_VALUE'; END IF;
  IF v_new_total > COALESCE((SELECT wod.wo_value FROM public.work_order_details wod WHERE wod.work_order_id = v_work_order.id LIMIT 1), v_work_order.project_value, 0) THEN RAISE EXCEPTION 'PAYMENT_EXCEEDS_APPROVED_VALUE'; END IF;

  UPDATE public.payment_entries SET
    amount_paid = p_amount,
    payment_date = COALESCE(p_payment_date, CURRENT_DATE),
    vendor_invoice_number = NULLIF(trim(p_vendor_invoice_number), ''),
    vendor_invoice_date = p_vendor_invoice_date,
    voucher_number = NULLIF(trim(p_voucher_number), ''),
    voucher_date = p_voucher_date,
    remarks = NULLIF(trim(p_remarks), '')
  WHERE id = p_payment_id;

  FOR v_row IN SELECT pe.* FROM public.payment_entries pe WHERE pe.section_id = v_payment.section_id ORDER BY pe.payment_date, pe.created_at, pe.id FOR UPDATE LOOP
    v_running_total := v_running_total + v_row.amount_paid;
    UPDATE public.payment_entries SET cumulative_paid = v_running_total WHERE id = v_row.id;
  END LOOP;

  v_running_total := 0;
  FOR v_row IN SELECT pe.* FROM public.payment_entries pe WHERE pe.work_order_id = v_work_order.id ORDER BY pe.payment_date, pe.created_at, pe.id FOR UPDATE LOOP
    v_running_total := v_running_total + v_row.amount_paid;
    IF v_row.section_id IS NULL THEN UPDATE public.payment_entries SET cumulative_paid = v_running_total WHERE id = v_row.id; END IF;
  END LOOP;

  UPDATE public.work_orders SET paid_amount = GREATEST(v_new_total, COALESCE(paid_amount, 0) - v_payment.amount_paid + p_amount) WHERE id = v_work_order.id;
  UPDATE public.projects SET paid_amount = COALESCE(paid_amount, 0) + (v_new_total - v_old_total) WHERE id = v_work_order.project_id;

  SELECT * INTO v_payment FROM public.payment_entries WHERE id = p_payment_id;
  RETURN v_payment;
END;
$function$;

REVOKE ALL ON FUNCTION public.record_section_payment(uuid, numeric, date, text, date, text, date, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_section_payment(uuid, numeric, date, text, date, text, date, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_section_payment(uuid, numeric, date, text, date, text, date, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_section_payment(uuid, numeric, date, text, date, text, date, text) TO anon, authenticated;