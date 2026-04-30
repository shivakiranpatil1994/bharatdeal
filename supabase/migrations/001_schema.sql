-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- MANUFACTURERS
CREATE TABLE manufacturers (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name            text NOT NULL,
  cluster         text NOT NULL,
  city            text NOT NULL,
  state           text NOT NULL,
  whatsapp_phone  text NOT NULL UNIQUE,
  login_email     text UNIQUE,
  category        text NOT NULL,
  gst_number      text,
  bank_account    jsonb DEFAULT '{}',
  seller_score    int DEFAULT 50 CHECK (seller_score BETWEEN 0 AND 100),
  verified        boolean DEFAULT false,
  active          boolean DEFAULT true,
  payout_schedule text DEFAULT 'T+2',
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- PRODUCTS (SKUs)
CREATE TABLE products (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  manufacturer_id uuid REFERENCES manufacturers(id) ON DELETE RESTRICT NOT NULL,
  title           text NOT NULL,
  title_hindi     text,
  description     text,
  price_paise     int NOT NULL CHECK (price_paise > 0),
  mrp_paise       int,
  images          text[] NOT NULL DEFAULT '{}',
  sizes           text[] DEFAULT '{}',
  colors          text[] DEFAULT '{}',
  category        text NOT NULL,
  subcategory     text,
  stock           int NOT NULL DEFAULT 0 CHECK (stock >= 0),
  is_flash_deal   boolean DEFAULT false,
  flash_discount_pct int CHECK (flash_discount_pct BETWEEN 0 AND 90),
  flash_ends_at   timestamptz,
  listing_quality_score int DEFAULT 50,
  active          boolean DEFAULT true,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- BUYERS
CREATE TABLE buyers (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  phone           text NOT NULL UNIQUE,
  name            text,
  default_pincode text,
  default_address jsonb DEFAULT '{}',
  rto_count       int DEFAULT 0,
  order_count     int DEFAULT 0,
  is_blocked      boolean DEFAULT false,
  block_reason    text,
  created_at      timestamptz DEFAULT now()
);

-- ORDERS
CREATE TABLE orders (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id          uuid REFERENCES products(id) NOT NULL,
  manufacturer_id     uuid REFERENCES manufacturers(id) NOT NULL,
  buyer_phone         text NOT NULL,
  buyer_name          text,
  buyer_pincode       text NOT NULL,
  buyer_address       text NOT NULL,
  buyer_city          text,
  buyer_state         text,
  quantity            int NOT NULL DEFAULT 1,
  size                text,
  color               text,
  amount_paise        int NOT NULL,
  mrp_paise           int,
  payment_method      text NOT NULL,
  payment_status      text DEFAULT 'pending',
  razorpay_order_id   text,
  razorpay_payment_id text,
  cod_deposit_paid    boolean DEFAULT false,
  cod_deposit_amount  int DEFAULT 0,
  shiprocket_order_id text,
  shiprocket_awb      text,
  courier_name        text,
  tracking_url        text,
  rto_risk_score      int,
  status              text DEFAULT 'placed',
  cancelled_reason    text,
  delivered_at        timestamptz,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

-- ORDER EVENTS
CREATE TABLE order_events (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id    uuid REFERENCES orders(id) ON DELETE CASCADE,
  event_type  text NOT NULL,
  description text,
  metadata    jsonb DEFAULT '{}',
  created_at  timestamptz DEFAULT now()
);

-- RETURNS
CREATE TABLE returns (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id        uuid REFERENCES orders(id) NOT NULL,
  reason          text NOT NULL,
  description     text,
  images          text[] DEFAULT '{}',
  status          text DEFAULT 'requested',
  refund_amount   int,
  refund_method   text,
  created_at      timestamptz DEFAULT now()
);

-- SEARCH EVENTS
CREATE TABLE search_events (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  term              text NOT NULL,
  term_normalised   text,
  results_count     int NOT NULL DEFAULT 0,
  buyer_pincode     text,
  buyer_state       text,
  clicked_product_id uuid REFERENCES products(id),
  converted         boolean DEFAULT false,
  session_id        text,
  created_at        timestamptz DEFAULT now()
);

-- MANUFACTURER ALERTS
CREATE TABLE manufacturer_alerts (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  manufacturer_id uuid REFERENCES manufacturers(id) ON DELETE CASCADE,
  type            text NOT NULL,
  title           text NOT NULL,
  message         text NOT NULL,
  recommended_action text,
  data_json       jsonb DEFAULT '{}',
  sent_whatsapp   boolean DEFAULT false,
  read            boolean DEFAULT false,
  created_at      timestamptz DEFAULT now()
);

-- PAYOUTS
CREATE TABLE payouts (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  manufacturer_id uuid REFERENCES manufacturers(id) NOT NULL,
  amount_paise    int NOT NULL,
  status          text DEFAULT 'pending',
  razorpay_payout_id text,
  orders_included uuid[],
  notes           text,
  processed_at    timestamptz,
  created_at      timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_orders_manufacturer ON orders(manufacturer_id, created_at DESC);
CREATE INDEX idx_orders_buyer_phone ON orders(buyer_phone);
CREATE INDEX idx_orders_pincode ON orders(buyer_pincode, status);
CREATE INDEX idx_orders_status ON orders(status, created_at DESC);
CREATE INDEX idx_products_manufacturer ON products(manufacturer_id, active);
CREATE INDEX idx_products_category ON products(category, active);
CREATE INDEX idx_search_events_term ON search_events USING gin(term_normalised gin_trgm_ops);
CREATE INDEX idx_search_events_pincode ON search_events(buyer_pincode, created_at DESC);
CREATE INDEX idx_alerts_manufacturer ON manufacturer_alerts(manufacturer_id, read, created_at DESC);
