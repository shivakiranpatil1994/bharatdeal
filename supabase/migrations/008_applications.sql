-- 008_applications.sql — Seller applications table
CREATE TABLE manufacturer_applications (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  business_name     text NOT NULL,
  business_type     text NOT NULL,
  gst_number        text,
  pan_number        text NOT NULL,
  registered_address text NOT NULL,
  city              text NOT NULL,
  state             text NOT NULL,
  pincode           text NOT NULL,
  cluster           text NOT NULL,
  contact_name      text NOT NULL,
  contact_role      text NOT NULL,
  phone             text NOT NULL,
  whatsapp_phone    text NOT NULL,
  email             text NOT NULL UNIQUE,
  password_hash     text NOT NULL,
  store_name        text NOT NULL,
  category          text NOT NULL,
  description       text,
  monthly_capacity  int DEFAULT 0,
  avg_price_paise   int DEFAULT 0,
  payout_schedule   text DEFAULT 'T+2',
  shipping_from     text,
  bank_account      jsonb DEFAULT '{}',
  status            text DEFAULT 'pending', -- 'pending'|'approved'|'rejected'
  admin_note        text,
  reviewed_at       timestamptz,
  created_at        timestamptz DEFAULT now()
);

CREATE INDEX idx_applications_status ON manufacturer_applications(status, created_at DESC);

-- Public insert (anyone can apply), no read (admin only via service role)
ALTER TABLE manufacturer_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone_can_apply" ON manufacturer_applications FOR INSERT WITH CHECK (true);
