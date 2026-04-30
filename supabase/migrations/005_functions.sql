-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables with updated_at
CREATE TRIGGER set_updated_at BEFORE UPDATE ON manufacturers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON ai_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Increment buyer order count on new order
CREATE OR REPLACE FUNCTION increment_buyer_order_count()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO buyers (phone, order_count)
  VALUES (NEW.buyer_phone, 1)
  ON CONFLICT (phone) DO UPDATE
    SET order_count = buyers.order_count + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_order_placed
  AFTER INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION increment_buyer_order_count();

-- Increment buyer RTO count on RTO status
CREATE OR REPLACE FUNCTION increment_buyer_rto_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'rto' AND OLD.status != 'rto' THEN
    UPDATE buyers SET rto_count = rto_count + 1
    WHERE phone = NEW.buyer_phone;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_order_rto
  AFTER UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION increment_buyer_rto_count();
