CREATE TABLE IF NOT EXISTS ru_price_snapshot (
  id INTEGER PRIMARY KEY,
  payload TEXT NOT NULL,
  fetched_at TEXT NOT NULL
);
