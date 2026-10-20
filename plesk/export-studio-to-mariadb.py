"""Convert Cloudflare D1 Studio table exports to a MariaDB data-only dump.

Usage: python plesk/export-studio-to-mariadb.py <studio-sql-dir> <output.sql>
The output contains orders and must stay outside Git and the public web root.
"""

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


def sql_value(value):
    if value is None:
        return "NULL"
    if isinstance(value, int):
        return str(value)
    if isinstance(value, bytes):
        return f"0x{value.hex()}"
    if value == "":
        return "''"
    return f"CONVERT(0x{str(value).encode('utf-8').hex()} USING utf8mb4)"


def main(source: Path, destination: Path) -> None:
    if destination.exists():
        raise SystemExit(f"Refusing to overwrite: {destination}")
    database = sqlite3.connect(":memory:")
    try:
        for migration in sorted((Path(__file__).resolve().parents[1] / "migrations").glob("[0-9]*.sql")):
            database.executescript(migration.read_text(encoding="utf-8"))
        for table in TABLES:
            exported = source / f"{table}.sql"
            if exported.is_file():
                database.executescript(exported.read_text(encoding="utf-8-sig"))
            elif table not in {"catalog_items", "admin_magic_links"}:
                raise SystemExit(f"Missing nonempty table export: {exported}")
        with destination.open("x", encoding="ascii", newline="\n") as stream:
            stream.write("SET NAMES utf8mb4;\nSTART TRANSACTION;\n")
            for table in TABLES:
                stream.write(f"DELETE FROM `{table}`;\n")
            for table in TABLES:
                cursor = database.execute(f'SELECT * FROM "{table}"')
                columns = [name for name, *_ in cursor.description]
                count = 0
                for row in cursor:
                    fields = ", ".join(f"`{name}`" for name in columns)
                    values = ", ".join(map(sql_value, row))
                    stream.write(f"INSERT INTO `{table}` ({fields}) VALUES ({values});\n")
                    count += 1
                print(f"{table}: {count}")
            stream.write("COMMIT;\n")
    finally:
        database.close()


if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit("Usage: python plesk/export-studio-to-mariadb.py <studio-sql-dir> <output.sql>")
    main(Path(sys.argv[1]).resolve(), Path(sys.argv[2]).resolve())
