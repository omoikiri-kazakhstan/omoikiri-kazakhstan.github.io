-- Apply to a NEW, empty staging database only. Never run over Bitrix.
-- Keep the connection at utf8mb4 and in UTC.
CREATE TABLE catalog_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(190) NOT NULL UNIQUE,
  name TEXT NOT NULL,
  sku VARCHAR(100) NOT NULL DEFAULT '',
  category VARCHAR(100) NOT NULL,
  image_url TEXT NOT NULL,
  price BIGINT NULL,
  old_price BIGINT NULL,
  description LONGTEXT NOT NULL,
  visible TINYINT(1) NOT NULL DEFAULT 1,
  is_custom TINYINT(1) NOT NULL DEFAULT 1,
  material TEXT NOT NULL,
  colors LONGTEXT NOT NULL,
  specifications LONGTEXT NOT NULL,
  variants LONGTEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at VARCHAR(40) NOT NULL DEFAULT '',
  KEY idx_catalog_items_category_visible (category, visible)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE admin_magic_links (
  token_hash CHAR(64) NOT NULL PRIMARY KEY,
  expires_at VARCHAR(40) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE catalog_visibility_overrides (
  slug VARCHAR(190) NOT NULL PRIMARY KEY,
  visible TINYINT(1) NOT NULL DEFAULT 1,
  hidden_colors LONGTEXT NOT NULL,
  updated_at VARCHAR(40) NOT NULL DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE orders (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  request_id CHAR(36) NOT NULL UNIQUE,
  customer_name VARCHAR(100) NOT NULL,
  phone VARCHAR(32) NOT NULL,
  city VARCHAR(100) NOT NULL,
  address VARCHAR(200) NOT NULL DEFAULT '',
  comment TEXT NOT NULL,
  items_json LONGTEXT NOT NULL,
  estimated_total BIGINT NOT NULL,
  notification_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(20) NOT NULL DEFAULT 'new',
  internal_note TEXT NOT NULL,
  updated_at VARCHAR(40) NOT NULL DEFAULT '',
  payment_status VARCHAR(30) NOT NULL DEFAULT 'not_required',
  payment_transaction_id VARCHAR(100) NOT NULL DEFAULT '',
  payment_test_mode TINYINT(1) NOT NULL DEFAULT 0,
  payment_paid_at VARCHAR(40) NOT NULL DEFAULT '',
  payment_checked_at VARCHAR(40) NOT NULL DEFAULT '',
  payment_expires_at VARCHAR(40) NOT NULL DEFAULT '',
  KEY idx_orders_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE stock_snapshot (
  id TINYINT UNSIGNED NOT NULL PRIMARY KEY,
  payload LONGTEXT NOT NULL,
  fetched_at VARCHAR(40) NOT NULL,
  moscow_modified_at VARCHAR(40) NULL,
  spb_modified_at VARCHAR(40) NULL,
  article_count INT UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
