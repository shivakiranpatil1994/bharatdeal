-- Manufacturer today stats (refreshed every 5 minutes by Edge Function)
CREATE MATERIALIZED VIEW manufacturer_today_stats AS
SELECT
  p.manufacturer_id,
  COUNT(DISTINCT o.id)                                        AS orders_today,
  COALESCE(SUM(o.amount_paise), 0)                           AS revenue_today_paise,
  COUNT(DISTINCT CASE WHEN r.id IS NOT NULL THEN o.id END)   AS returns_today,
  ROUND(
    COUNT(DISTINCT CASE WHEN r.id IS NOT NULL THEN o.id END) * 100.0
    / NULLIF(COUNT(DISTINCT o.id), 0), 1
  )                                                           AS return_rate,
  COALESCE(SUM(p2.stock), 0)                                 AS total_stock
FROM products p2
LEFT JOIN orders o
  ON o.product_id = p2.id
  AND o.created_at >= CURRENT_DATE
  AND o.payment_status = 'paid'
LEFT JOIN returns r ON r.order_id = o.id
JOIN manufacturers p ON p.id = p2.manufacturer_id
WHERE p2.active = true
GROUP BY p.manufacturer_id;

CREATE UNIQUE INDEX ON manufacturer_today_stats(manufacturer_id);

CREATE OR REPLACE FUNCTION refresh_manufacturer_stats()
RETURNS void AS $$
  REFRESH MATERIALIZED VIEW CONCURRENTLY manufacturer_today_stats;
$$ LANGUAGE sql SECURITY DEFINER;
