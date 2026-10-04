import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "sih.db")

def migrate():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("PRAGMA table_info(human_escalations)")
    columns = [row[1] for row in cursor.fetchall()]
    print(f"Existing columns in human_escalations: {columns}")

    new_cols = [
        ("started_at", "DATETIME"),
        ("resolved_by_user_id", "INTEGER"),
        ("resolution_notes", "TEXT"),
    ]

    for col_name, col_type in new_cols:
        if col_name not in columns:
            print(f"Adding column {col_name} ({col_type})...")
            cursor.execute(f"ALTER TABLE human_escalations ADD COLUMN {col_name} {col_type}")

    conn.commit()
    conn.close()
    print("[SUCCESS] human_escalations migration complete.")

if __name__ == "__main__":
    migrate()
