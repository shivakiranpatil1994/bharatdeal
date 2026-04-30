-- Enable RLS on all tables
ALTER TABLE manufacturers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE manufacturer_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_sku_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE pincode_demand ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Manufacturers: see only themselves
CREATE POLICY "manufacturers_own_record"
  ON manufacturers FOR SELECT
  USING (id = auth.uid());

-- Products: manufacturer sees only their own
CREATE POLICY "manufacturers_own_products"
  ON products FOR ALL
  USING (manufacturer_id = auth.uid());

-- Products: public read for active products (buyers can see)
CREATE POLICY "public_read_active_products"
  ON products FOR SELECT
  USING (active = true);

-- Orders: manufacturer sees only orders for their products
CREATE POLICY "manufacturers_own_orders"
  ON orders FOR SELECT
  USING (manufacturer_id = auth.uid());

-- Manufacturer alerts: see only own alerts
CREATE POLICY "manufacturers_own_alerts"
  ON manufacturer_alerts FOR ALL
  USING (manufacturer_id = auth.uid());

-- Daily SKU metrics: own only
CREATE POLICY "manufacturers_own_metrics"
  ON daily_sku_metrics FOR SELECT
  USING (manufacturer_id = auth.uid());

-- Pincode demand: own only
CREATE POLICY "manufacturers_own_pincode_demand"
  ON pincode_demand FOR SELECT
  USING (manufacturer_id = auth.uid());

-- AI insights: own only
CREATE POLICY "manufacturers_own_ai_insights"
  ON ai_insights FOR ALL
  USING (manufacturer_id = auth.uid());

-- AI conversations: own only
CREATE POLICY "manufacturers_own_conversations"
  ON ai_conversations FOR ALL
  USING (manufacturer_id = auth.uid());

-- Payouts: own only
CREATE POLICY "manufacturers_own_payouts"
  ON payouts FOR SELECT
  USING (manufacturer_id = auth.uid());

-- Search events: insert-only from anon
CREATE POLICY "anyone_insert_search"
  ON search_events FOR INSERT
  WITH CHECK (true);

-- Events: insert-only from anon
CREATE POLICY "anyone_insert_events"
  ON events FOR INSERT
  WITH CHECK (true);
