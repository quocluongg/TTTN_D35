# Hướng dẫn chạy RAGAS Benchmark trên Google Colab

## Tại sao dùng Colab?

Máy local không đủ RAM để load 2 embedding models cùng lúc (BGE-M3 ~570M params + RAGAS embeddings). Colab free tier có **15GB RAM + T4 GPU** — đủ cho cả benchmark.

---

## Bước 1: Upload source code lên Colab

### Cách A: Upload từ GitHub (khuyến nghị)

```python
# Cell 1: Clone repo
!git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
%cd YOUR_REPO
!git checkout ai
%cd ai-v3
```

### Cách B: Upload trực tiếp

1. Tạo notebook mới trên [colab.research.google.com](https://colab.research.google.com)
2. Upload folder `ai-v3/` lên Colab:
   - Click icon folder bên trái (📂)
   - Right-click → Upload → chọn folder `ai-v3/`

---

## Bước 2: Cài đặt dependencies

```python
# Cell 2: Install dependencies
!pip install -q ragas>=0.2.0 langchain-google-genai>=2.0.0 datasets>=2.14.0
!pip install -q sentence-transformers tqdm numpy pandas
!pip install -q google-generativeai langchain-community langchain-huggingface
!pip install -q rank-bm25 supabase
```

---

## Bước 3: Setup API Keys

```python
# Cell 3: Setup environment variables
import os

# Gemini API Key (dùng gemini-3.1-flash-lite, quota 500/ngày)
os.environ["GEMINI_API_KEY"] = "YOUR_GEMINI_API_KEY_HERE"

# Model - dùng 3.1 flash lite (500 quota, không phải 3.5 flash chỉ 20 quota)
os.environ["GEMINI_MODEL"] = "gemini-3.1-flash-lite"

# Supabase DB (nếu cần load products từ DB)
os.environ["DB_HOST"] = "aws-0-ap-southeast-1.pooler.supabase.com"
os.environ["DB_PORT"] = "6543"
os.environ["DB_NAME"] = "postgres"
os.environ["DB_USER"] = "postgres.zzukpubwbntihzztilqy"
os.environ["DB_PASSWORD"] = "agW24oOesftDhJkA"

print("✅ Environment variables set!")
print(f"   Model: {os.environ['GEMINI_MODEL']}")
```

---

## Bước 4: Verify setup

```python
# Cell 4: Verify imports and DB connection
import sys
sys.path.insert(0, ".")

# Test DB connection
from core.db import fetch_all_products
products = fetch_all_products()
print(f"✅ Database connected: {len(products)} products loaded")

# Test Gemini API
import google.generativeai as genai
genai.configure(api_key=os.environ["GEMINI_API_KEY"])
model = genai.GenerativeModel("gemini-3.1-flash-lite")
resp = model.generate_content("Say hello in Vietnamese")
print(f"✅ Gemini API works: {resp.text[:50]}")
```

---

## Bước 5: Chạy benchmark 2 câu (test thử)

```python
# Cell 5: Test run with 2 questions
# Tạm sửa range(1, 3) để test
import run_ragas_benchmark

# Override dataset size
original_func = run_ragas_benchmark.generate_100_eval_dataset
def test_dataset(seed=42):
    import random
    random.seed(seed)
    dataset = []
    TEMPLATES = run_ragas_benchmark.TEMPLATES
    BRANDS = run_ragas_benchmark.BRANDS
    PRODUCT_TYPES = run_ragas_benchmark.PRODUCT_TYPES
    SPECS_KEYS = run_ragas_benchmark.SPECS_KEYS
    USE_CASES = run_ragas_benchmark.USE_CASES
    BUDGETS = run_ragas_benchmark.BUDGETS

    for i in range(1, 3):  # Only 2 questions
        intent, tmpl = random.choice(TEMPLATES)
        brand = random.choice(BRANDS)
        brand2 = random.choice([b for b in BRANDS if b != brand])
        ptype = random.choice(PRODUCT_TYPES)
        ptype2 = random.choice(PRODUCT_TYPES)
        spec = random.choice(SPECS_KEYS)
        ucase = random.choice(USE_CASES)
        budget = random.choice(BUDGETS)

        q = tmpl.format(
            product_type=ptype, product_type2=ptype2,
            brand=brand, brand2=brand2,
            spec_key=spec, use_case=ucase, budget=budget
        )
        gt = f"Sản phẩm {ptype} của thương hiệu {brand} ({spec}) phù hợp cho {ucase} với mức giá khoảng {budget} triệu VNĐ."
        dataset.append({
            "id": i, "question": q, "intent": intent,
            "expected_brand": brand, "expected_category": ptype,
            "ground_truth": gt
        })
    return dataset

run_ragas_benchmark.generate_100_eval_dataset = test_dataset
result = run_ragas_benchmark.run_100_ragas_benchmark()
print("\n✅ Test run completed!")
```

---

## Bước 6: Chạy full 100 câu

Nếu test 2 câu OK, chạy full:

```python
# Cell 6: Run full 100-question benchmark
# Reset về dataset gốc
run_ragas_benchmark.generate_100_eval_dataset = original_func

# Xóa checkpoint cũ (nếu muốn chạy lại từ đầu)
import os
checkpoint_path = "eval/cache/ragas_100_batch_checkpoint.json"
if os.path.exists(checkpoint_path):
    os.remove(checkpoint_path)
    print("🗑️ Checkpoint cleared")

# Chạy benchmark
result = run_ragas_benchmark.run_100_ragas_benchmark()
print("\n🎉 Full benchmark completed!")
```

---

## Bước 7: Download kết quả

```python
# Cell 7: Download results
from google.colab import files

# Download JSON results
files.download("eval/ragas_eval_results.json")

# Download Markdown report
files.download("eval/ragas_benchmark_report.md")

# Download checkpoint (để resume nếu cần)
files.download("eval/cache/ragas_100_batch_checkpoint.json")
```

---

## Troubleshooting

### Lỗi: "429 RESOURCE_EXHAUSTED"
→ Gemini free tier quota đã hết. Đợi reset (24h) hoặc dùng API key khác.
→ Hoặc set `SKIP_RAGAS_LLM=true` để dùng rule-based metrics:

```python
os.environ["SKIP_RAGAS_LLM"] = "true"
```

### Lỗi: "OOM / Segfault" khi load embedding model
→ Colab free có 15GB RAM, đủ cho cả 2 models. Nếu vẫn lỗi:
  - Đổi runtime sang **T4 GPU** (Runtime → Change runtime type → T4)
  - Hoặc set `SKIP_RAGAS_LLM=true`

### Lỗi: "No module named 'core'"
→ Đảm bảo `%cd` vào đúng thư mục `ai-v3/`

### Muốn resume từ checkpoint
→ Không xóa file checkpoint ở Cell 6. Script tự detect và skip câu đã completed.

---

## Files output

| File | Nội dung |
|------|----------|
| `eval/ragas_eval_results.json` | Full JSON results (per-sample + aggregate) |
| `eval/ragas_benchmark_report.md` | Markdown report cho đồ án |
| `eval/cache/ragas_100_batch_checkpoint.json` | Checkpoint (dùng để resume) |
