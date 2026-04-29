-- Tighten order insert: only for enabled computer
DROP POLICY "Anyone can create orders" ON public.orders;
CREATE POLICY "Create order for enabled computer" ON public.orders FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM public.computers c WHERE c.id = computer_id AND c.enabled = true));

-- Tighten order_items insert: must reference an order that exists
DROP POLICY "Anyone can create order items" ON public.order_items;
CREATE POLICY "Create items for existing order" ON public.order_items FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id));

-- Lock down has_role
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon, authenticated;

-- Storage: drop broad SELECT, allow direct file access only (no listing)
DROP POLICY "Public read product images" ON storage.objects;
-- Public bucket already allows direct URL access; no listing policy needed.