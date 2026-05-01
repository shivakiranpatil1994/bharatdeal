-- 007_auth_users.sql — Create dummy auth users for manufacturer login
-- Run this in Supabase SQL Editor AFTER 006_seed.sql
--
-- This creates Supabase Auth users with email + password so manufacturers
-- can log in at /manufacturer/login without magic link.
--
-- DUMMY CREDENTIALS (for development/demo):
--   Email:    manufacturer@bharatdeal.in
--   Password: bharatdeal@123
--
-- To create a real manufacturer user, use the Supabase Dashboard:
--   Authentication → Users → Add User → Email + Password

-- Create the demo manufacturer auth user
-- NOTE: auth.users is managed by Supabase — use the dashboard UI or the admin API
-- The SQL below works only if you run it as a service role in the SQL editor:

INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  role,
  aud
) VALUES (
  '11111111-1111-1111-1111-111111111111',  -- same UUID as the manufacturer row
  '00000000-0000-0000-0000-000000000000',
  'manufacturer@bharatdeal.in',
  crypt('bharatdeal@123', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  now(),
  now(),
  'authenticated',
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- Also insert into auth.identities (required for email/password login)
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '11111111-1111-1111-1111-111111111111',
  jsonb_build_object('sub', '11111111-1111-1111-1111-111111111111', 'email', 'manufacturer@bharatdeal.in'),
  'email',
  'manufacturer@bharatdeal.in',
  now(),
  now(),
  now()
) ON CONFLICT DO NOTHING;
