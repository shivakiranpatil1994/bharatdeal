-- 009_product_approvals.sql — Product approval workflow
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'approved', -- 'pending'|'approved'|'rejected'
  ADD COLUMN IF NOT EXISTS approval_note    text,
  ADD COLUMN IF NOT EXISTS approval_reviewed_at timestamptz;

-- Existing products are already approved
UPDATE products SET approval_status = 'approved' WHERE approval_status IS NULL;

CREATE INDEX IF NOT EXISTS idx_products_approval ON products(approval_status, created_at DESC);
