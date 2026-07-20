"""
Executes all SQL batch files in scripts/batches/ against Supabase using exec_sql RPC.
"""

import sys
import time
import requests
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent
BATCH_DIR = BASE_DIR / "scripts" / "batches"
SUPABASE_URL = "https://zzukpubwbntihzztilqy.supabase.co"
PUBLISHABLE_KEY = "sb_publishable_B9KmQKIqZ69xa0UnQqVq3g_IGFdBtCV"

def execute_batch_file(file_path):
    sql_content = file_path.read_text(encoding="utf-8")
    
    # Strip BEGIN / COMMIT if calling via EXECUTE inside function, or keep single statement block
    # Note: EXECUTE in PL/pgSQL doesn't support transaction control (BEGIN/COMMIT) inside function body.
    cleaned_sql = []
    for line in sql_content.splitlines():
        line_s = line.strip()
        if line_s.upper() in ("BEGIN;", "COMMIT;"):
            continue
        cleaned_sql.append(line)
        
    final_sql = "\n".join(cleaned_sql)
    
    rpc_url = f"{SUPABASE_URL}/rest/v1/rpc/exec_sql"
    headers = {
        "apikey": PUBLISHABLE_KEY,
        "Authorization": f"Bearer {PUBLISHABLE_KEY}",
        "Content-Type": "application/json"
    }
    
    res = requests.post(rpc_url, headers=headers, json={"sql_query": final_sql})
    return res.status_code, res.text

def main():
    sys.stdout.reconfigure(encoding="utf-8")
    batches = sorted(list(BATCH_DIR.glob("*.sql")))
    print(f"Starting execution of {len(batches)} batch files...")
    
    success_count = 0
    fail_count = 0
    
    start_time = time.time()
    
    for i, batch_file in enumerate(batches, start=1):
        print(f"[{i:02d}/{len(batches)}] Executing {batch_file.name}...", end=" ", flush=True)
        status, resp = execute_batch_file(batch_file)
        if status in (200, 204):
            print("OK")
            success_count += 1
        else:
            print(f"FAILED (Status {status}): {resp[:200]}")
            fail_count += 1
            
        time.sleep(0.05)
        
    duration = time.time() - start_time
    print(f"\nMigration completed in {duration:.2f} seconds!")
    print(f"Success: {success_count}/{len(batches)}, Failures: {fail_count}")

if __name__ == "__main__":
    main()
