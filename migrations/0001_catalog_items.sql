CREATE TABLE IF NOT EXISTS catalog_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  sku TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL,
  image_url TEXT NOT NULL DEFAULT '',
  price INTEGER,
  old_price INTEGER,
  description TEXT NOT NULL DEFAULT '',
  visible INTEGER NOT NULL DEFAULT 1 CHECK (visible IN (0, 1)),
  is_custom INTEGER NOT NULL DEFAULT 1 CHECK (is_custom IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_catalog_items_category_visible
  ON catalog_items(category, visible);
