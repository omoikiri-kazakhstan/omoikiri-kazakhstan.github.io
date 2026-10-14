CREATE TABLE IF NOT EXISTS stock_snapshot (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  payload TEXT NOT NULL,
  fetched_at TEXT NOT NULL,
  moscow_modified_at TEXT,
  spb_modified_at TEXT,
  article_count INTEGER NOT NULL
);
