import sqlite3

def run_migration():
    conn = sqlite3.connect('sih.db')
    cursor = conn.cursor()

    migrations = [
        # courses
        ('courses', 'status', "VARCHAR(50) DEFAULT 'demo'"),
        ('courses', 'verified_at', 'TIMESTAMP NULL'),
        ('courses', 'verified_by', 'INTEGER NULL'),
        # occupations
        ('occupations', 'status', "VARCHAR(50) DEFAULT 'demo'"),
        ('occupations', 'verified_at', 'TIMESTAMP NULL'),
        ('occupations', 'verified_by', 'INTEGER NULL'),
        ('occupations', 'data_source_id', 'INTEGER NULL'),
        # training_providers
        ('training_providers', 'status', "VARCHAR(50) DEFAULT 'demo'"),
        ('training_providers', 'verified_at', 'TIMESTAMP NULL'),
        ('training_providers', 'verified_by', 'INTEGER NULL'),
        ('training_providers', 'data_source_id', 'INTEGER NULL'),
        # job_outcomes
        ('job_outcomes', 'status', "VARCHAR(50) DEFAULT 'demo'"),
        ('job_outcomes', 'verified_at', 'TIMESTAMP NULL'),
        ('job_outcomes', 'verified_by', 'INTEGER NULL'),
        # career_paths
        ('career_paths', 'status', "VARCHAR(50) DEFAULT 'demo'"),
        ('career_paths', 'verified_at', 'TIMESTAMP NULL'),
        ('career_paths', 'verified_by', 'INTEGER NULL'),
        ('career_paths', 'data_source_id', 'INTEGER NULL'),
        # data_sources
        ('data_sources', 'status', "VARCHAR(50) DEFAULT 'demo'"),
        ('data_sources', 'verified_at', 'TIMESTAMP NULL'),
        ('data_sources', 'verified_by', 'INTEGER NULL'),
    ]

    for table, col, col_def in migrations:
        cursor.execute(f"PRAGMA table_info({table})")
        existing = [c[1] for c in cursor.fetchall()]
        if col not in existing:
            sql = f"ALTER TABLE {table} ADD COLUMN {col} {col_def}"
            print(f"Applying: {sql}")
            cursor.execute(sql)
        else:
            print(f"{table}.{col} already exists")

    conn.commit()
    conn.close()
    print("Migration complete!")

if __name__ == "__main__":
    run_migration()
