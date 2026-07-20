"""
Batch execution helper for Supabase SQL migration
"""
import sys
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent
BATCH_DIR = BASE_DIR / "scripts" / "batches"

def get_batch_content(batch_name):
    file_path = BATCH_DIR / batch_name
    if not file_path.exists():
        raise FileNotFoundError(f"Batch file {batch_name} not found")
    return file_path.read_text(encoding="utf-8")

if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    if len(sys.argv) > 1:
        name = sys.argv[1]
        print(get_batch_content(name))
    else:
        batches = sorted([f.name for f in BATCH_DIR.glob("*.sql")])
        print(f"Total batches: {len(batches)}")
        for b in batches:
            p = BATCH_DIR / b
            print(f"  {b}: {len(p.read_text(encoding='utf-8'))} chars")
