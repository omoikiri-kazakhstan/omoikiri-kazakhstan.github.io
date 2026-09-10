CREATE TABLE IF NOT EXISTS admin_magic_links (
  token_hash TEXT PRIMARY KEY,
  expires_at TEXT NOT NULL
);
