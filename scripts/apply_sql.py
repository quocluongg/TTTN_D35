"""
Script to chunk data_migration.sql and execute via Supabase Direct / REST or Python runner
"""

import json
import re
import urllib.request
import urllib.parse
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent
SQL_PATH = BASE_DIR / "scripts" / "data_migration.sql"

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

if __name__ == "__main__":
    stmts = parse_sql_statements(SQL_PATH)
    print(f"Total SQL Statements parsed: {len(stmts)}")
