"""Convert a Wrangler D1 SQL export (or SQLite DB) to private JSONL files.

Usage: python plesk/export-d1.py d1-export.sql plesk/data
The output contains customer orders; keep it out of Git and the web root.
"""

import json
import sqlite3
import sys
from pathlib import Path

TABLES = (
    "catalog_items",
    "admin_magic_links",
    "catalog_visibility_overrides",
    "orders",
    "stock_snapshot",
)


def main(source: Path, destination: Path) -> None:
    if not source.is_file():
        raise SystemExit(f"Source does not exist: {source}")
    if destination.exists() and any(destination.iterdir()):
        raise SystemExit(f"Destination must be empty: {destination}")
    if source.suffix.lower() in {".sqlite", ".db"}:
        database = sqlite3.connect(f"file:{source}?mode=ro", uri=True)
    else:
        database = sqlite3.connect(":memory:")
        database.executescript(source.read_text(encoding="utf-8-sig"))
    database.row_factory = sqlite3.Row
    destination.mkdir(parents=True, exist_ok=True)
    try:
        for table in TABLES:
            if database.execute("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?", (table,)).fetchone() is None:
                raise RuntimeError(f"D1 export is missing {table}")
            output = destination / f"{table}.jsonl"
            count = 0
            with output.open("w", encoding="utf-8", newline="\n") as stream:
                for row in database.execute(f"SELECT * FROM {table}"):
                    stream.write(json.dumps(dict(row), ensure_ascii=False, separators=(",", ":")) + "\n")
                    count += 1
            print(f"{table}: {count}")
    finally:
        database.close()


if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit("Usage: python plesk/export-d1.py <d1-export.sql|db.sqlite> <empty-output-dir>")
    main(Path(sys.argv[1]).resolve(), Path(sys.argv[2]).resolve())
