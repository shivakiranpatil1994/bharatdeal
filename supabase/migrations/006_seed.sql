-- 006_seed.sql — Seed data for BharatDeal MVP
-- Run AFTER all previous migrations

-- ============================================================
-- MANUFACTURERS
-- ============================================================
INSERT INTO manufacturers (id, name, cluster, city, state, whatsapp_phone, login_email, category, seller_score, verified, active, payout_schedule)
VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    'Tirupur Cotton Co',
    'Tirupur',
    'Tirupur',
    'Tamil Nadu',
    '9876543210',
    'tirupur@bharatdeal.in',
    'Cotton Knitwear',
    78,
    true,
    true,
    'T+2'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'Surat Saree House',
    'Surat',
    'Surat',
    'Gujarat',
    '9876543211',
    'surat@bharatdeal.in',
    'Sarees',
    85,
    true,
    true,
    'T+2'
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'Moradabad Brass Works',
    'Moradabad',
    'Moradabad',
    'Uttar Pradesh',
    '9876543212',
    'moradabad@bharatdeal.in',
    'Brass Home Decor',
    72,
    true,
    true,
    'T+7'
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- PRODUCTS (10 SKUs)
-- ============================================================
INSERT INTO products (
  manufacturer_id, title, title_hindi, description,
  price_paise, mrp_paise, images, sizes, colors,
  category, stock, is_flash_deal, flash_discount_pct, flash_ends_at, active
) VALUES

-- 1. Flash deal T-shirt
(
  '11111111-1111-1111-1111-111111111111',
  'Premium Cotton Round Neck T-Shirt',
  'प्रीमियम कॉटन राउंड नेक टी-शर्ट',
  'Soft 180 GSM 100% combed cotton. Pre-shrunk, double-stitched collar. Factory-direct from Tirupur.',
  39900, 79900,
  ARRAY['https://res.cloudinary.com/demo/image/upload/v1/bharatdeal/placeholder_1.jpg'],
  ARRAY['S','M','L','XL','XXL'],
  ARRAY['White','Black','Navy','Grey'],
  'Cotton Knitwear',
  150,
  true, 50, now() + interval '2 days',
  true
),

-- 2. Polo T-shirt
(
  '11111111-1111-1111-1111-111111111111',
  'Men''s Cotton Polo T-Shirt',
  'मेन्स कॉटन पोलो टी-शर्ट',
  '220 GSM pique cotton polo. Ribbed collar and cuffs. 3-button placket. Perfect for office wear.',
  59900, 99900,
  ARRAY['https://res.cloudinary.com/demo/image/upload/v1/bharatdeal/placeholder_2.jpg'],
  ARRAY['S','M','L','XL'],
  ARRAY['White','Blue','Green'],
  'Cotton Knitwear',
  200,
  false, NULL, NULL,
  true
),

-- 3. Flash deal Kurti
(
  '11111111-1111-1111-1111-111111111111',
  'Women''s Cotton Kurti',
  'वुमेन्स कॉटन कुर्ती',
  'Block printed 100% cotton kurti with ethnic motifs. Breathable, machine washable.',
  49900, 89900,
  ARRAY['https://res.cloudinary.com/demo/image/upload/v1/bharatdeal/placeholder_3.jpg'],
  ARRAY['S','M','L','XL','XXL'],
  ARRAY['Red','Blue','Yellow','Pink'],
  'Cotton Knitwear',
  120,
  true, 44, now() + interval '1 day',
  true
),

-- 4. Banarasi Saree
(
  '22222222-2222-2222-2222-222222222222',
  'Pure Silk Banarasi Saree',
  'शुद्ध सिल्क बनारसी साड़ी',
  'Authentic Banarasi silk saree with zari border and pallu. Handwoven in Varanasi. 6.5 metres.',
  299900, 599900,
  ARRAY['https://res.cloudinary.com/demo/image/upload/v1/bharatdeal/placeholder_4.jpg'],
  ARRAY[]::text[],
  ARRAY['Red','Green','Blue','Golden'],
  'Sarees',
  30,
  false, NULL, NULL,
  true
),

-- 5. Cotton Printed Saree
(
  '22222222-2222-2222-2222-222222222222',
  'Cotton Printed Saree',
  'कॉटन प्रिंटेड साड़ी',
  'Vibrant digital printed cotton saree. Comfortable for daily wear. Comes with matching blouse piece.',
  89900, 149900,
  ARRAY['https://res.cloudinary.com/demo/image/upload/v1/bharatdeal/placeholder_5.jpg'],
  ARRAY[]::text[],
  ARRAY['Purple','Orange','Teal'],
  'Sarees',
  80,
  false, NULL, NULL,
  true
),

-- 6. Flash deal Georgette Saree
(
  '22222222-2222-2222-2222-222222222222',
  'Georgette Party Wear Saree',
  'जॉर्जेट पार्टी वेयर साड़ी',
  'Premium georgette saree with heavy embroidery border. Perfect for weddings and parties.',
  149900, 299900,
  ARRAY['https://res.cloudinary.com/demo/image/upload/v1/bharatdeal/placeholder_6.jpg'],
  ARRAY[]::text[],
  ARRAY['Navy','Maroon','Beige'],
  'Sarees',
  45,
  true, 50, now() + interval '12 hours',
  true
),

-- 7. Brass Diya Set
(
  '33333333-3333-3333-3333-333333333333',
  'Brass Diya Set (Pack of 6)',
  'पीतल दीया सेट (6 का पैक)',
  'Hand-crafted brass diyas. Traditional design with flower motif. Set of 6 diyas of varying sizes.',
  39900, 69900,
  ARRAY['https://res.cloudinary.com/demo/image/upload/v1/bharatdeal/placeholder_7.jpg'],
  ARRAY[]::text[],
  ARRAY[]::text[],
  'Brass Home Decor',
  300,
  false, NULL, NULL,
  true
),

-- 8. Brass Vase
(
  '33333333-3333-3333-3333-333333333333',
  'Decorative Brass Flower Vase',
  'सजावटी पीतल का फूलदान',
  'Engraved brass vase with floral and peacock motifs. Height: 10 inches. Gift-ready packaging.',
  79900, 139900,
  ARRAY['https://res.cloudinary.com/demo/image/upload/v1/bharatdeal/placeholder_8.jpg'],
  ARRAY[]::text[],
  ARRAY[]::text[],
  'Brass Home Decor',
  80,
  false, NULL, NULL,
  true
),

-- 9. Flash deal Ganesh Idol
(
  '33333333-3333-3333-3333-333333333333',
  'Brass Ganesh Idol - 6 inch',
  'पीतल गणेश मूर्ति - 6 इंच',
  'Pure brass Ganesh idol, 6 inch height. Detailed craftsmanship from Moradabad artisans. Auspicious gift.',
  129900, 249900,
  ARRAY['https://res.cloudinary.com/demo/image/upload/v1/bharatdeal/placeholder_9.jpg'],
  ARRAY[]::text[],
  ARRAY[]::text[],
  'Brass Home Decor',
  50,
  true, 48, now() + interval '3 days',
  true
),

-- 10. Kids Shorts Pack
(
  '11111111-1111-1111-1111-111111111111',
  'Kids Cotton Shorts (Pack of 3)',
  'किड्स कॉटन शॉर्ट्स (3 का पैक)',
  '100% cotton jersey shorts for kids. Elastic waistband. Durable, colorfast. Pack of 3 assorted colors.',
  29900, 59900,
  ARRAY['https://res.cloudinary.com/demo/image/upload/v1/bharatdeal/placeholder_10.jpg'],
  ARRAY['2-3Y','3-4Y','4-5Y','5-6Y'],
  ARRAY['Multi'],
  'Cotton Knitwear',
  500,
  false, NULL, NULL,
  true
);

-- ============================================================
-- SEARCH TRENDS (sample data)
-- ============================================================
INSERT INTO search_trends (term, category, count_this_week, count_last_week, growth_pct, zero_results, top_pincodes)
VALUES
  ('cotton t-shirt', 'Cotton Knitwear', 1240, 980, 26.5, false, ARRAY['641601','641602','400001','560001']),
  ('plain white tshirt', 'Cotton Knitwear', 890, 650, 36.9, false, ARRAY['641601','500001','380001']),
  ('round neck tshirt under 500', 'Cotton Knitwear', 740, 520, 42.3, false, ARRAY['641601','641603','600001']),
  ('organic cotton kurti', 'Cotton Knitwear', 560, 320, 75.0, true, ARRAY['400001','110001','500001']),
  ('sports dry fit tshirt', 'Cotton Knitwear', 480, 290, 65.5, true, ARRAY['641601','560001','411001']),
  ('silk saree wedding', 'Sarees', 920, 780, 17.9, false, ARRAY['380001','411001','500001']),
  ('banarasi saree under 3000', 'Sarees', 760, 540, 40.7, false, ARRAY['110001','400001','700001']),
  ('cotton saree office wear', 'Sarees', 620, 490, 26.5, false, ARRAY['380001','600001','560001']),
  ('party wear saree under 2000', 'Sarees', 590, 410, 43.9, true, ARRAY['400001','380001','110001']),
  ('kanjivaram saree', 'Sarees', 430, 280, 53.6, true, ARRAY['600001','641601','700001']),
  ('brass diya festival', 'Brass Home Decor', 880, 610, 44.3, false, ARRAY['110001','400001','700001']),
  ('ganesh idol brass gift', 'Brass Home Decor', 650, 420, 54.8, false, ARRAY['400001','560001','411001']),
  ('brass home decor set', 'Brass Home Decor', 490, 310, 58.1, false, ARRAY['110001','400001','380001']),
  ('brass puja thali set', 'Brass Home Decor', 390, 180, 116.7, true, ARRAY['110001','700001','400001']),
  ('brass temple bell large', 'Brass Home Decor', 310, 140, 121.4, true, ARRAY['110001','400001','560001'])
ON CONFLICT (term) DO NOTHING;

-- ============================================================
-- MANUFACTURER ALERTS (2-3 per manufacturer)
-- ============================================================
INSERT INTO manufacturer_alerts (manufacturer_id, type, title, message, recommended_action, sent_whatsapp, read)
VALUES
  -- Tirupur Cotton Co alerts
  (
    '11111111-1111-1111-1111-111111111111',
    'low-stock',
    'Premium Cotton T-Shirt Running Low',
    'Your Premium Cotton Round Neck T-Shirt has only 150 units left. At current sales velocity (32 units/day), you have ~4.7 days of stock remaining.',
    'Increase production or pause the flash deal to conserve inventory.',
    false, false
  ),
  (
    '11111111-1111-1111-1111-111111111111',
    'trend',
    'Trending: Organic Cotton Demand Spike',
    '560 buyers searched "organic cotton kurti" this week with zero results on the platform. This is unmet demand you can capture.',
    'List an organic cotton kurti variant. Buyers are ready to buy — no competition currently.',
    false, false
  ),
  (
    '11111111-1111-1111-1111-111111111111',
    'opportunity',
    'Sports Dry-Fit T-Shirts: 480 Searches, No Results',
    '480 buyers searched for dry-fit sports t-shirts this week. You have the knitting machines to produce this. Estimated margin: 45%.',
    'Source dry-fit fabric from Erode and list 2 variants within 7 days.',
    false, false
  ),

  -- Surat Saree House alerts
  (
    '22222222-2222-2222-2222-222222222222',
    'quality-spike',
    'Return Rate Spike on Georgette Saree',
    '3 returns in last 48 hours for Georgette Party Wear Saree citing "colour different from image". Return rate hit 12% vs platform avg of 4.2%.',
    'Update product images with accurate color photos. Consider adding a color note in description.',
    true, false
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'opportunity',
    'Party Sarees Under ₹2000: High Demand, Limited Supply',
    '590 buyers searched "party wear saree under 2000" this week. Your Georgette saree at ₹1499 is close — consider a flash deal.',
    'Run a 1-day flash deal at ₹1499 to capture this demand and boost your seller score.',
    false, false
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'trend',
    'Kanjivaram Sarees: Growing Search Volume',
    '"Kanjivaram saree" searches grew 53.6% this week with zero results. Premium segment, high margin opportunity.',
    'If you have Kanjivaram partnerships, list them. Platform has no competition in this category.',
    false, false
  ),

  -- Moradabad Brass Works alerts
  (
    '33333333-3333-3333-3333-333333333333',
    'trend',
    'Puja Thali Sets: 116.7% Search Growth',
    '"Brass puja thali set" searches grew 116.7% this week with zero results. Festival season driving demand.',
    'List a brass puja thali set within the next 3 days to capture festival demand.',
    false, false
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'opportunity',
    'Temple Bell: 310 Searches, No Listings',
    '310 buyers searched "brass temple bell large" with zero results. Your workshop likely makes these.',
    'List a large brass temple bell. Buyers are searching but have no options — 100% market share available.',
    false, false
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'low-stock',
    'Ganesh Idol Flash Deal: Stock Check',
    'Flash deal for Brass Ganesh Idol ends in 3 days. Only 50 units in stock. Monitor sell-through rate.',
    'Prepare 100 more units before flash deal ends to avoid stockout at peak demand.',
    false, false
  );
