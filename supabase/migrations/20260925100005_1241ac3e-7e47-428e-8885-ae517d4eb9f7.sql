
-- ROLES
CREATE TYPE public.app_role AS ENUM ('admin','customer');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "admins read all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- bootstrap: first signed-in user may claim admin only while no admin exists
CREATE OR REPLACE FUNCTION public.claim_first_admin()
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RETURN false; END IF;
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN RETURN false; END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (uid,'admin') ON CONFLICT DO NOTHING;
  RETURN true;
END; $$;
GRANT EXECUTE ON FUNCTION public.claim_first_admin() TO authenticated;

-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  full_name text,
  phone text,
  delivery_location text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "admins read profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'phone')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id,'customer') ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- PRODUCTS
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  description text,
  size text,
  unit text NOT NULL DEFAULT 'each',
  price numeric(10,2) NOT NULL CHECK (price >= 0),
  stock integer NOT NULL DEFAULT 100,
  image_key text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone reads products" ON public.products FOR SELECT USING (true);
CREATE POLICY "admins manage products" ON public.products FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER products_updated BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- DELIVERY ZONES
CREATE TABLE public.delivery_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  fee numeric(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.delivery_zones TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.delivery_zones TO authenticated;
GRANT ALL ON public.delivery_zones TO service_role;
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone reads zones" ON public.delivery_zones FOR SELECT USING (true);
CREATE POLICY "admins manage zones" ON public.delivery_zones FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- CART
CREATE TABLE public.cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cart_items TO authenticated;
GRANT ALL ON public.cart_items TO service_role;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own cart" ON public.cart_items FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ORDERS
CREATE SEQUENCE public.order_number_seq START 1001;
GRANT USAGE ON SEQUENCE public.order_number_seq TO authenticated, service_role;

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE DEFAULT ('WP-' || lpad(nextval('public.order_number_seq')::text, 5, '0')),
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'Pending Payment'
    CHECK (status IN ('Pending Payment','Payment Verification','Paid','Processing','Ready for Delivery','Out for Delivery','Delivered','Cancelled')),
  customer_name text,
  customer_phone text,
  delivery_location text NOT NULL,
  delivery_zone text,
  delivery_fee numeric(10,2) NOT NULL DEFAULT 0,
  subtotal numeric(10,2) NOT NULL DEFAULT 0,
  total numeric(10,2) NOT NULL DEFAULT 0,
  mpesa_code text,
  payment_verified boolean NOT NULL DEFAULT false,
  payment_note text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own orders read" ON public.orders FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "admins read orders" ON public.orders FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "own orders insert" ON public.orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own orders update" ON public.orders FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admins update orders" ON public.orders FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER orders_updated BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- customers may not self-verify payment or jump status
CREATE OR REPLACE FUNCTION public.guard_order_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.has_role(auth.uid(),'admin') THEN RETURN NEW; END IF;
  NEW.payment_verified := OLD.payment_verified;
  IF NEW.status NOT IN (OLD.status, 'Payment Verification', 'Cancelled') THEN
    NEW.status := OLD.status;
  END IF;
  IF OLD.status NOT IN ('Pending Payment','Payment Verification') THEN
    NEW.status := OLD.status;
  END IF;
  NEW.subtotal := OLD.subtotal; NEW.total := OLD.total; NEW.delivery_fee := OLD.delivery_fee;
  RETURN NEW;
END; $$;
CREATE TRIGGER orders_guard BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.guard_order_update();

CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  size text,
  unit text,
  unit_price numeric(10,2) NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own order items read" ON public.order_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));
CREATE POLICY "admins read order items" ON public.order_items FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "own order items insert" ON public.order_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));

-- TRAINING BOOKINGS
CREATE TABLE public.training_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  name text NOT NULL,
  phone text NOT NULL,
  preferred_date date NOT NULL,
  course text NOT NULL DEFAULT 'Paper Packaging Production Training',
  fee numeric(10,2) NOT NULL DEFAULT 15000,
  status text NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending','Approved','Confirmed','Completed','Cancelled')),
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.training_bookings TO authenticated;
GRANT ALL ON public.training_bookings TO service_role;
ALTER TABLE public.training_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own bookings read" ON public.training_bookings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own bookings insert" ON public.training_bookings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admins manage bookings" ON public.training_bookings FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER bookings_updated BEFORE UPDATE ON public.training_bookings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- CONTACT MESSAGES
CREATE TABLE public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  message text NOT NULL,
  handled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.contact_messages TO anon;
GRANT SELECT, INSERT, UPDATE ON public.contact_messages TO authenticated;
GRANT ALL ON public.contact_messages TO service_role;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone sends message" ON public.contact_messages FOR INSERT WITH CHECK (
  length(name) BETWEEN 1 AND 100 AND length(phone) BETWEEN 1 AND 30 AND length(message) BETWEEN 1 AND 2000
);
CREATE POLICY "admins read messages" ON public.contact_messages FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins update messages" ON public.contact_messages FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- BUSINESS INFO
CREATE TABLE public.business_info (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  phone text NOT NULL,
  whatsapp text NOT NULL,
  location text NOT NULL,
  operating_days text NOT NULL,
  operating_hours text NOT NULL,
  facebook text NOT NULL,
  tiktok text NOT NULL,
  about text NOT NULL,
  mission text NOT NULL,
  vision text NOT NULL,
  training_fee numeric(10,2) NOT NULL DEFAULT 15000,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.business_info TO anon;
GRANT SELECT, UPDATE ON public.business_info TO authenticated;
GRANT ALL ON public.business_info TO service_role;
ALTER TABLE public.business_info ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone reads business info" ON public.business_info FOR SELECT USING (true);
CREATE POLICY "admins update business info" ON public.business_info FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

INSERT INTO public.business_info (id, phone, whatsapp, location, operating_days, operating_hours, facebook, tiktok, about, mission, vision)
VALUES (1, '072509498', '072509498', 'Murang''a County, Kiria-ini Town, Behind Bingo Hardware', 'Monday - Saturday', '8:00 AM - 5:00 PM',
 'Waki Paper and Production', 'Waki Paper and Production',
 'We specialize with quality paper packaging products for businesses and individuals. We focus on providing practical, affordable, and reliable packaging solutions.',
 'To provide quality and affordable paper packaging products that meet our customers'' needs.',
 'To become a trusted and leading provider of sustainable paper packaging solutions.');

INSERT INTO public.delivery_zones (name, fee) VALUES
 ('Kiria-ini Town', 0), ('Kangema', 150), ('Murang''a Town', 250), ('Other location (fee set by admin)', 300);

INSERT INTO public.products (name, category, description, size, unit, price, image_key, sort_order) VALUES
 ('Packaging Bags No. 6','Packaging Bags','Strong brown kraft packaging bags, size No. 6.','No. 6','per 50 pieces',250,'packaging-bags',1),
 ('Packaging Bags No. 5','Packaging Bags','Strong brown kraft packaging bags, size No. 5.','No. 5','per 50 pieces',150,'packaging-bags',2),
 ('Packaging Bags No. 4','Packaging Bags','Strong brown kraft packaging bags, size No. 4.','No. 4','per 50 pieces',130,'packaging-bags',3),
 ('Packaging Bags No. 3','Packaging Bags','Strong brown kraft packaging bags, size No. 3.','No. 3','per 50 pieces',110,'packaging-bags',4),
 ('Packaging Bags No. 2','Packaging Bags','Strong brown kraft packaging bags, size No. 2.','No. 2','per 50 pieces',100,'packaging-bags',5),
 ('Packaging Bags No. 1','Packaging Bags','Strong brown kraft packaging bags, size No. 1.','No. 1','per 50 pieces',80,'packaging-bags',6),
 ('Packaging Bags 1/2','Packaging Bags','Strong brown kraft packaging bags, size 1/2.','1/2','per 50 pieces',70,'packaging-bags',7),
 ('Packaging Bags 1/4','Packaging Bags','Strong brown kraft packaging bags, size 1/4.','1/4','per 50 pieces',60,'packaging-bags',8),
 ('Book Covers A4','Book Covers','Branded or unbranded A4 book covers.','A4','each',20,'book-covers',9),
 ('Book Covers A5','Book Covers','Branded or unbranded A5 book covers.','A5','each',10,'book-covers',10),
 ('Envelopes A4','Envelopes','Brown A4 envelopes.','A4','per 50 pieces',70,'envelopes',11),
 ('Envelopes A5','Envelopes','Brown A5 envelopes.','A5','per 50 pieces',50,'envelopes',12),
 ('Cake Boxes','Cake Boxes','Sturdy cake boxes for bakeries and celebrations.',NULL,'each',30,'cake-boxes',13),
 ('Popcorn Bags 1 kg','Popcorn Bags','Brown popcorn bags, 1 kg size.','1 kg','per 50 pieces',90,'popcorn-bags',14),
 ('Popcorn Bags 1/2 kg','Popcorn Bags','Brown popcorn bags, 1/2 kg size.','1/2 kg','per 50 pieces',70,'popcorn-bags',15),
 ('Popcorn Bags 1/4 kg','Popcorn Bags','Brown popcorn bags, 1/4 kg size.','1/4 kg','per 50 pieces',60,'popcorn-bags',16),
 ('Charcoal Briquettes','Charcoal Briquettes','Long burning charcoal briquettes.',NULL,'per kg',150,'charcoal-briquettes',17),
 ('Gift Bags Small','Gift Bags','Brown paper gift bags, small size.','Small','each',50,'gift-bags',18),
 ('Gift Bags Medium','Gift Bags','Brown paper gift bags, medium size.','Medium','each',100,'gift-bags',19),
 ('Gift Bags Large','Gift Bags','Brown paper gift bags, large size.','Large','each',150,'gift-bags',20);
