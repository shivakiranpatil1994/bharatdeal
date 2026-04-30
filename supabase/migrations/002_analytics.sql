-- EVENTS
CREATE TABLE events (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_name      text NOT NULL,
  session_id      text,
  buyer_phone     text,
  product_id      uuid REFERENCES products(id),
  manufacturer_id uuid REFERENCES manufacturers(id),
  pincode         text,
  state           text,
  city            text,
  device_type     text,
  os              text,
  properties      jsonb DEFAULT '{}',
  created_at      timestamptz DEFAULT now()
);
CREATE INDEX idx_events_name_time ON events(event_name, created_at DESC);
CREATE INDEX idx_events_pincode ON events(pincode, created_at DESC);
CREATE INDEX idx_events_manufacturer ON events(manufacturer_id, event_name, created_at DESC);

-- DAILY SKU METRICS
CREATE TABLE daily_sku_metrics (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  date            date NOT NULL,
  product_id      uuid REFERENCES products(id) NOT NULL,
  manufacturer_id uuid REFERENCES manufacturers(id) NOT NULL,
  orders_count    int DEFAULT 0,
  revenue_paise   bigint DEFAULT 0,
  returns_count   int DEFAULT 0,
  return_rate     numeric(5,2) DEFAULT 0,
  top_pincode     text,
  top_city        text,
  UNIQUE(date, product_id)
);
CREATE INDEX idx_daily_sku_manufacturer ON daily_sku_metrics(manufacturer_id, date DESC);

-- PINCODE DEMAND
CREATE TABLE pincode_demand (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  week_start      date NOT NULL,
  pincode         text NOT NULL,
  state           text,
  city            text,
  district        text,
  tier            int,
  product_id      uuid REFERENCES products(id),
  manufacturer_id uuid REFERENCES manufacturers(id),
  search_count    int DEFAULT 0,
  order_count     int DEFAULT 0,
  rto_count       int DEFAULT 0,
  rto_rate        numeric(5,2) DEFAULT 0,
  avg_price_paise int,
  UNIQUE(week_start, pincode, product_id)
);
CREATE INDEX idx_pincode_demand_manufacturer ON pincode_demand(manufacturer_id, week_start DESC);

-- SEARCH TRENDS
CREATE TABLE search_trends (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  term              text NOT NULL,
  category          text,
  count_this_week   int DEFAULT 0,
  count_last_week   int DEFAULT 0,
  growth_pct        numeric(8,2) DEFAULT 0,
  zero_results      boolean DEFAULT false,
  top_pincodes      text[],
  updated_at        timestamptz DEFAULT now(),
  UNIQUE(term)
);
CREATE INDEX idx_search_trends_category ON search_trends(category, growth_pct DESC);
CREATE INDEX idx_search_trends_zero ON search_trends(zero_results, count_this_week DESC);

-- AI INSIGHTS
CREATE TABLE ai_insights (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  manufacturer_id uuid REFERENCES manufacturers(id) ON DELETE CASCADE,
  insight_type    text NOT NULL,
  title           text NOT NULL,
  content         text NOT NULL,
  content_hindi   text,
  data_snapshot   jsonb,
  generated_at    timestamptz DEFAULT now(),
  read            boolean DEFAULT false
);
CREATE INDEX idx_ai_insights_manufacturer ON ai_insights(manufacturer_id, generated_at DESC);

-- AI CONVERSATIONS
CREATE TABLE ai_conversations (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  manufacturer_id uuid REFERENCES manufacturers(id) ON DELETE CASCADE,
  messages        jsonb DEFAULT '[]',
  title           text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- PINCODE MASTER
CREATE TABLE pincode_master (
  pincode   text PRIMARY KEY,
  city      text,
  district  text,
  state     text,
  region    text,
  tier      int,
  rto_risk  text DEFAULT 'medium'
);

-- ADMIN AUDIT LOG
CREATE TABLE admin_actions (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  action        text NOT NULL,
  target_type   text NOT NULL,
  target_id     text,
  old_value     jsonb,
  new_value     jsonb,
  performed_at  timestamptz DEFAULT now()
);
