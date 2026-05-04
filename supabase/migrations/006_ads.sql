-- ============================================================
-- BharatDeal Ads System — Phase 1 Migration
-- Run this in Supabase SQL Editor
-- ============================================================

-- AD WALLETS
CREATE TABLE IF NOT EXISTS ad_wallets (
  manufacturer_id  uuid REFERENCES manufacturers(id) PRIMARY KEY,
  balance_paise    bigint NOT NULL DEFAULT 0 CHECK (balance_paise >= 0),
  total_topped_up  bigint NOT NULL DEFAULT 0,
  total_spent      bigint NOT NULL DEFAULT 0,
  updated_at       timestamptz DEFAULT now()
);

-- Create wallet automatically when manufacturer is created
CREATE OR REPLACE FUNCTION create_ad_wallet_on_manufacturer_insert()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO ad_wallets (manufacturer_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER auto_create_ad_wallet
  AFTER INSERT ON manufacturers
  FOR EACH ROW EXECUTE FUNCTION create_ad_wallet_on_manufacturer_insert();

-- Backfill wallets for existing manufacturers
INSERT INTO ad_wallets (manufacturer_id)
SELECT id FROM manufacturers
ON CONFLICT DO NOTHING;

-- AD CAMPAIGNS
CREATE TABLE IF NOT EXISTS ad_campaigns (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  manufacturer_id  uuid REFERENCES manufacturers(id) NOT NULL,
  name             text NOT NULL,
  ad_type          text NOT NULL CHECK (ad_type IN (
                     'sponsored_search','product_card','flash_deal','banner','zero_result')),
  product_id       uuid REFERENCES products(id) NOT NULL,

  -- Targeting
  keywords         text[] NOT NULL DEFAULT '{}',
  categories       text[] NOT NULL DEFAULT '{}',
  target_pincodes  text[] NOT NULL DEFAULT '{}',

  -- Flash deal specific
  flash_slot_date  date,
  flash_slot_time  text,
  flash_fee_paise  int,

  -- Budget (all in paise — ₹1 = 100 paise)
  max_bid_paise         int NOT NULL CHECK (max_bid_paise > 0),
  daily_budget_paise    int NOT NULL CHECK (daily_budget_paise >= 10000),
  total_budget_paise    int NOT NULL,
  spent_today_paise     int NOT NULL DEFAULT 0,
  total_spent_paise     bigint NOT NULL DEFAULT 0,

  -- Schedule
  start_date  date NOT NULL DEFAULT CURRENT_DATE,
  end_date    date,

  -- Admin review (admin writes via service role only)
  review_status   text NOT NULL DEFAULT 'pending_review' CHECK (review_status IN (
                    'pending_review','approved','rejected','needs_changes','suspended')),
  reviewed_at     timestamptz,
  review_note     text,
  reject_reason   text,
  auto_flags      jsonb NOT NULL DEFAULT '[]',
  auto_approved   boolean NOT NULL DEFAULT false,

  -- Runtime status (manufacturer can pause/resume)
  status  text NOT NULL DEFAULT 'pending_review' CHECK (status IN (
            'pending_review','active','paused','ended','budget_exhausted','rejected')),

  -- Cached quality score (updated daily by cron)
  quality_score   numeric(4,3) NOT NULL DEFAULT 0.500,

  -- Aggregate counters (updated by cron — not real-time)
  total_impressions  bigint NOT NULL DEFAULT 0,
  total_clicks       bigint NOT NULL DEFAULT 0,
  total_conversions  bigint NOT NULL DEFAULT 0,
  total_revenue_paise bigint NOT NULL DEFAULT 0,

  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_manufacturer
  ON ad_campaigns(manufacturer_id, status);
CREATE INDEX IF NOT EXISTS idx_campaigns_review
  ON ad_campaigns(review_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_campaigns_active
  ON ad_campaigns(status, ad_type) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_campaigns_keywords
  ON ad_campaigns USING gin(keywords);

-- AD IMPRESSIONS
CREATE TABLE IF NOT EXISTS ad_impressions (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id      uuid REFERENCES ad_campaigns(id) NOT NULL,
  product_id       uuid REFERENCES products(id) NOT NULL,
  query            text,
  placement        text NOT NULL,
  position         int NOT NULL DEFAULT 1,
  ad_score         numeric(12,6),
  actual_cpc_paise int,
  quality_score    numeric(4,3),
  relevance_score  numeric(4,3),
  pctr             numeric(6,5),
  buyer_pincode    text,
  buyer_session    text,
  buyer_ip_hash    text,
  created_at       timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_impressions_campaign
  ON ad_impressions(campaign_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_impressions_date
  ON ad_impressions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_impressions_session
  ON ad_impressions(buyer_session, campaign_id);

-- AD CLICKS
CREATE TABLE IF NOT EXISTS ad_clicks (
  id                 uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  impression_id      uuid REFERENCES ad_impressions(id) NOT NULL,
  campaign_id        uuid REFERENCES ad_campaigns(id) NOT NULL,
  product_id         uuid REFERENCES products(id) NOT NULL,
  manufacturer_id    uuid REFERENCES manufacturers(id) NOT NULL,
  cpc_charged_paise  int NOT NULL CHECK (cpc_charged_paise > 0),
  buyer_pincode      text,
  buyer_ip_hash      text,
  is_fraud           boolean NOT NULL DEFAULT false,
  created_at         timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clicks_campaign
  ON ad_clicks(campaign_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clicks_manufacturer
  ON ad_clicks(manufacturer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clicks_fraud_check
  ON ad_clicks(buyer_ip_hash, campaign_id, created_at DESC);

-- AD CONVERSIONS
CREATE TABLE IF NOT EXISTS ad_conversions (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  click_id      uuid REFERENCES ad_clicks(id) NOT NULL UNIQUE,
  campaign_id   uuid REFERENCES ad_campaigns(id) NOT NULL,
  order_id      uuid REFERENCES orders(id) NOT NULL,
  revenue_paise int NOT NULL,
  attributed_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conversions_campaign
  ON ad_conversions(campaign_id);

-- AD QUALITY SCORES
CREATE TABLE IF NOT EXISTS ad_quality_scores (
  product_id              uuid REFERENCES products(id) PRIMARY KEY,
  quality_score           numeric(4,3) NOT NULL DEFAULT 0.500,
  return_rate_score       numeric(4,3),
  seller_score_norm       numeric(4,3),
  listing_quality_score   numeric(4,3),
  review_rating_norm      numeric(4,3),
  fulfillment_speed_score numeric(4,3),
  override_score          numeric(4,3),
  override_reason         text,
  override_type           text,
  override_expires_at     timestamptz,
  override_set_at         timestamptz,
  computed_at             timestamptz DEFAULT now()
);

-- AD WALLET TRANSACTIONS
CREATE TABLE IF NOT EXISTS ad_wallet_transactions (
  id                   uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  manufacturer_id      uuid REFERENCES manufacturers(id) NOT NULL,
  type                 text NOT NULL CHECK (type IN (
                         'topup','click_deduction','flash_deal_fee',
                         'banner_fee','refund')),
  amount_paise         int NOT NULL,
  campaign_id          uuid REFERENCES ad_campaigns(id),
  click_id             uuid REFERENCES ad_clicks(id),
  description          text,
  razorpay_payment_id  text,
  razorpay_order_id    text,
  buyer_pincode        text,
  created_at           timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wallet_tx_manufacturer
  ON ad_wallet_transactions(manufacturer_id, created_at DESC);

-- AD REVIEW LOG
CREATE TABLE IF NOT EXISTS ad_review_log (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id  uuid REFERENCES ad_campaigns(id) NOT NULL,
  action       text NOT NULL,
  reason       text,
  note         text,
  reviewed_at  timestamptz DEFAULT now()
);

-- ALGORITHM CONFIG
CREATE TABLE IF NOT EXISTS algorithm_config (
  id  uuid DEFAULT gen_random_uuid() PRIMARY KEY,

  weight_bid        numeric(4,3) NOT NULL DEFAULT 0.350,
  weight_quality    numeric(4,3) NOT NULL DEFAULT 0.300,
  weight_relevance  numeric(4,3) NOT NULL DEFAULT 0.200,
  weight_pctr       numeric(4,3) NOT NULL DEFAULT 0.150,

  qs_weight_return_rate   numeric(4,3) NOT NULL DEFAULT 0.300,
  qs_weight_seller_score  numeric(4,3) NOT NULL DEFAULT 0.250,
  qs_weight_listing       numeric(4,3) NOT NULL DEFAULT 0.200,
  qs_weight_rating        numeric(4,3) NOT NULL DEFAULT 0.150,
  qs_weight_fulfillment   numeric(4,3) NOT NULL DEFAULT 0.100,

  min_quality_score       numeric(4,3) NOT NULL DEFAULT 0.300,
  min_relevance_score     numeric(4,3) NOT NULL DEFAULT 0.200,
  min_bid_search_paise    int NOT NULL DEFAULT 200,
  min_bid_card_paise      int NOT NULL DEFAULT 150,
  min_bid_banner_cpm      int NOT NULL DEFAULT 5000,
  max_rto_pct             numeric(4,1) NOT NULL DEFAULT 25.0,

  auto_approve_min_qs     numeric(4,3) NOT NULL DEFAULT 0.700,
  auto_approve_max_rto    numeric(4,1) NOT NULL DEFAULT 8.0,

  attribution_days        int NOT NULL DEFAULT 7,
  fraud_cooldown_hours    int NOT NULL DEFAULT 24,
  max_clicks_per_ip_day   int NOT NULL DEFAULT 5,

  is_active       boolean NOT NULL DEFAULT true,
  change_reason   text,
  changed_by      text DEFAULT 'admin',
  effective_at    timestamptz DEFAULT now(),
  revert_at       timestamptz,
  created_at      timestamptz DEFAULT now()
);

INSERT INTO algorithm_config (change_reason, changed_by)
VALUES ('Initial default configuration', 'system')
ON CONFLICT DO NOTHING;

-- ALGORITHM CHANGE LOG
CREATE TABLE IF NOT EXISTS algorithm_change_log (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  config_id     uuid REFERENCES algorithm_config(id),
  field_name    text NOT NULL,
  old_value     text,
  new_value     text,
  change_reason text,
  changed_by    text,
  changed_at    timestamptz DEFAULT now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE ad_wallets             ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_campaigns           ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_clicks              ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_impressions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_conversions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_quality_scores      ENABLE ROW LEVEL SECURITY;

-- Wallet: manufacturer sees only own
CREATE POLICY "own_wallet" ON ad_wallets
  FOR ALL USING (manufacturer_id = auth.uid());

-- Campaigns: manufacturer reads own
CREATE POLICY "own_campaigns_read" ON ad_campaigns
  FOR SELECT USING (manufacturer_id = auth.uid());

-- Campaigns: manufacturer inserts own (review fields locked at default)
CREATE POLICY "own_campaigns_insert" ON ad_campaigns
  FOR INSERT WITH CHECK (
    manufacturer_id = auth.uid()
    AND review_status = 'pending_review'
    AND status = 'pending_review'
  );

-- Campaigns: manufacturer updates own (review field protection handled in API layer)
CREATE POLICY "own_campaigns_update" ON ad_campaigns
  FOR UPDATE USING (manufacturer_id = auth.uid())
  WITH CHECK (manufacturer_id = auth.uid());

-- Clicks: manufacturer reads own
CREATE POLICY "own_clicks" ON ad_clicks
  FOR SELECT USING (manufacturer_id = auth.uid());

-- Impressions: manufacturer reads own campaigns
CREATE POLICY "own_impressions" ON ad_impressions
  FOR SELECT USING (
    campaign_id IN (
      SELECT id FROM ad_campaigns WHERE manufacturer_id = auth.uid()
    )
  );

-- Conversions: manufacturer reads own
CREATE POLICY "own_conversions" ON ad_conversions
  FOR SELECT USING (
    campaign_id IN (
      SELECT id FROM ad_campaigns WHERE manufacturer_id = auth.uid()
    )
  );

-- Wallet transactions: manufacturer reads own
CREATE POLICY "own_wallet_tx" ON ad_wallet_transactions
  FOR SELECT USING (manufacturer_id = auth.uid());

-- Quality scores: public read (auction engine needs this)
CREATE POLICY "public_read_qs" ON ad_quality_scores
  FOR SELECT USING (true);

-- ============================================================
-- HELPER FUNCTION: Reset daily spend at midnight
-- Called by Edge Function cron
-- ============================================================
CREATE OR REPLACE FUNCTION reset_daily_ad_spend()
RETURNS void AS $$
BEGIN
  -- Reset daily spend counters
  UPDATE ad_campaigns
  SET spent_today_paise = 0
  WHERE status IN ('active', 'budget_exhausted');

  -- Re-activate campaigns that were paused due to budget exhaustion
  -- (new day = new daily budget)
  UPDATE ad_campaigns
  SET status = 'active'
  WHERE status = 'budget_exhausted'
    AND review_status = 'approved'
    AND total_spent_paise < total_budget_paise
    AND (end_date IS NULL OR end_date >= CURRENT_DATE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- HELPER FUNCTION: Credit ad wallet (called after Razorpay payment)
-- ============================================================
CREATE OR REPLACE FUNCTION credit_ad_wallet(
  p_manufacturer_id     uuid,
  p_amount_paise        bigint,
  p_razorpay_payment_id text,
  p_razorpay_order_id   text
)
RETURNS void AS $$
BEGIN
  INSERT INTO ad_wallets (manufacturer_id, balance_paise, total_topped_up, updated_at)
  VALUES (p_manufacturer_id, p_amount_paise, p_amount_paise, now())
  ON CONFLICT (manufacturer_id) DO UPDATE
    SET balance_paise   = ad_wallets.balance_paise + p_amount_paise,
        total_topped_up = ad_wallets.total_topped_up + p_amount_paise,
        updated_at      = now();

  INSERT INTO ad_wallet_transactions
    (manufacturer_id, type, amount_paise, razorpay_payment_id, razorpay_order_id, description)
  VALUES
    (p_manufacturer_id, 'topup', p_amount_paise, p_razorpay_payment_id, p_razorpay_order_id,
     'Ad wallet top-up via Razorpay');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- HELPER FUNCTION: Deduct ad wallet on click (atomic)
-- ============================================================
CREATE OR REPLACE FUNCTION deduct_ad_wallet(
  p_manufacturer_id uuid,
  p_amount_paise    int,
  p_campaign_id     uuid,
  p_click_id        uuid,
  p_buyer_pincode   text DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  UPDATE ad_wallets
  SET balance_paise = balance_paise - p_amount_paise,
      total_spent   = total_spent   + p_amount_paise,
      updated_at    = now()
  WHERE manufacturer_id = p_manufacturer_id;

  UPDATE ad_campaigns
  SET spent_today_paise = spent_today_paise + p_amount_paise,
      total_spent_paise = total_spent_paise + p_amount_paise,
      updated_at        = now()
  WHERE id = p_campaign_id;

  UPDATE ad_campaigns
  SET status     = 'budget_exhausted',
      updated_at = now()
  WHERE id = p_campaign_id
    AND spent_today_paise >= daily_budget_paise;

  INSERT INTO ad_wallet_transactions
    (manufacturer_id, type, amount_paise, campaign_id, click_id, description, buyer_pincode)
  VALUES
    (p_manufacturer_id, 'click_deduction', p_amount_paise, p_campaign_id, p_click_id,
     'CPC charge', p_buyer_pincode);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
