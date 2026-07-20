"""
Splits data_migration.sql into batch files capped at ~50KB or 50 statements each.
"""

from pathlib import Path

BASE_DIR = Path(__file__).parent.parent
SQL_PATH = BASE_DIR / "scripts" / "data_migration.sql"
BATCH_DIR = BASE_DIR / "scripts" / "batches"

# Clean old batches
if BATCH_DIR.exists():
    for f in BATCH_DIR.glob("*.sql"):
        f.unlink()
BATCH_DIR.mkdir(parents=True, exist_ok=True)

def parse_sql_statements(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    statements = []
    current_stmt = []
    
    for line in content.splitlines():
        if line.strip().startswith("--"):
            continue
        if not line.strip():
            continue
        current_stmt.append(line)
        if line.strip().endswith(";"):
            statements.append("\n".join(current_stmt))
            current_stmt = []
            
    if current_stmt:
        statements.append("\n".join(current_stmt))
        
    return statements

def generate_size_capped_batches(max_chars=50000, max_stmts=50):
    stmts = parse_sql_statements(SQL_PATH)
    total = len(stmts)
    print(f"Total SQL statements: {total}")
    
    current_batch = []
    current_size = 0
    batch_index = 1
    
    for stmt in stmts:
        stmt_len = len(stmt)
        if current_batch and (current_size + stmt_len > max_chars or len(current_batch) >= max_stmts):
            batch_sql = "BEGIN;\n" + "\n".join(current_batch) + "\nCOMMIT;"
            batch_file = BATCH_DIR / f"batch_{batch_index:03d}.sql"
            batch_file.write_text(batch_sql, encoding="utf-8")
            print(f"Wrote {batch_file.name}: {len(current_batch)} stmts, {len(batch_sql)} chars")
            batch_index += 1
            current_batch = []
            current_size = 0
            
        current_batch.append(stmt)
        current_size += stmt_len
        
    if current_batch:
        batch_sql = "BEGIN;\n" + "\n".join(current_batch) + "\nCOMMIT;"
        batch_file = BATCH_DIR / f"batch_{batch_index:03d}.sql"
        batch_file.write_text(batch_sql, encoding="utf-8")
        print(f"Wrote {batch_file.name}: {len(current_batch)} stmts, {len(batch_sql)} chars")

if __name__ == "__main__":
    generate_size_capped_batches(50000, 50)
