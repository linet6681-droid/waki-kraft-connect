CREATE UNIQUE INDEX IF NOT EXISTS orders_mpesa_code_unique ON public.orders (upper(mpesa_code)) WHERE mpesa_code IS NOT NULL AND payment_verified;

CREATE OR REPLACE FUNCTION public.verify_mpesa_payment(_order_id uuid, _code text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c text := upper(trim(_code)); o public.orders%ROWTYPE;
BEGIN
  SELECT * INTO o FROM public.orders WHERE id = _order_id AND user_id = auth.uid();
  IF NOT FOUND THEN RETURN 'not_found'; END IF;
  IF o.payment_verified THEN RETURN 'already_paid'; END IF;
  IF o.status = 'Cancelled' THEN RETURN 'cancelled'; END IF;
  IF c !~ '^[A-Z][A-Z0-9]{9}$' OR c !~ '[0-9]' THEN
    UPDATE public.orders SET payment_note = 'Payment declined: invalid M-Pesa code.' WHERE id = _order_id;
    RETURN 'declined_invalid';
  END IF;
  IF EXISTS (SELECT 1 FROM public.orders WHERE upper(mpesa_code) = c AND payment_verified) THEN
    UPDATE public.orders SET payment_note = 'Payment declined: this M-Pesa code has already been used.' WHERE id = _order_id;
    RETURN 'declined_used';
  END IF;
  UPDATE public.orders SET mpesa_code = c, payment_verified = true, status = 'Paid', payment_note = NULL WHERE id = _order_id;
  RETURN 'paid';
END; $$;
REVOKE EXECUTE ON FUNCTION public.verify_mpesa_payment(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.verify_mpesa_payment(uuid, text) TO authenticated;