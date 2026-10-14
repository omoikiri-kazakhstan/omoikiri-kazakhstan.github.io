ALTER TABLE orders ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'not_required';
ALTER TABLE orders ADD COLUMN payment_transaction_id TEXT NOT NULL DEFAULT '';
ALTER TABLE orders ADD COLUMN payment_test_mode INTEGER NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN payment_paid_at TEXT NOT NULL DEFAULT '';
ALTER TABLE orders ADD COLUMN payment_checked_at TEXT NOT NULL DEFAULT '';
ALTER TABLE orders ADD COLUMN payment_expires_at TEXT NOT NULL DEFAULT '';
