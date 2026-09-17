CREATE TABLE IF NOT EXISTS catalog_visibility_overrides (
  slug TEXT PRIMARY KEY NOT NULL,
  visible INTEGER NOT NULL DEFAULT 1 CHECK (visible IN (0, 1)),
  hidden_colors TEXT NOT NULL DEFAULT '[]',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
