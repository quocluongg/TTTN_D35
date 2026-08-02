# 🚀 Google Colab: Fine-tuning PhoBERT NLU & Out-of-Scope Detection Chuyên Ngành Điện Tử

File này chứa toàn bộ mã nguồn Python dạng Notebook chuẩn bị sẵn để chạy trực tiếp trên **Google Colab** (sử dụng GPU T4 miễn phí), nạp trực tiếp tập dữ liệu thực tế đã qua cân bằng nhãn **`balanced_intent_nar_dataset.json`**.

---

## 📌 Mục Tiêu Module NLU & Intent Router
1. **Phân loại các loại Intent chính của E-commerce Điện tử**:
   - `ask_specs`: Hỏi thông số kỹ thuật (RAM, CPU, GPU, Màn hình, SSD...)
   - `compare_products`: So sánh giữa 2 hoặc nhiều sản phẩm (Macbook vs Win, Air vs Pro...)
   - `ask_price`: Hỏi giá bán / khoảng giá
   - `ask_warranty`: Hỏi chính sách bảo hành, đổi trả, 1 đổi 1
   - `purchase_consultation`: Tư vấn chọn mua theo nhu cầu/tầm giá/ngành học
   - `ask_promotion`: Hỏi chương trình khuyến mãi, ưu đãi HSSV, voucher
   - `order_product`: Ý định đặt hàng / mua ngay
   - `complain`: Khiếu nại, báo lỗi máy, giao nhầm
   - `general_query`: Trò chuyện / Hỏi đáp chung
   - `out_of_scope`: Phát hiện câu hỏi ngoài phạm vi e-commerce công nghệ
2. **Trích xuất thực thể NER (Named Entity Recognition)**:
   - `PRODUCT_NAME` (Tên đầy đủ sản phẩm)
   - `BRAND` (Thương hiệu: Asus, Dell, Apple, Lenovo, HP...)
   - `MODEL` (Dòng máy: TUF Gaming, XPS, Legion, Macbook...)
   - `PRICE` (Mức giá / Khoảng giá: 15 triệu, 20-30 củ...)
   - `SPEC` (Thông số: RAM 16GB, SSD 512GB, RTX 4060, OLED 120Hz...)
3. **Cơ chế Out-of-Scope (OOS) Detection & Anti-Hallucination**:
   - Tự động nhận diện các câu hỏi lạc đề (thời tiết, ẩm thực, toán học, chính trị...).
   - Nếu confidence score < **0.65** hoặc thuộc intent lạc đề, mô hình chủ động từ chối trả lời thay vì đưa ra thông tin sai lệch (hallucination).

---

## 🛠️ Hướng Dẫn Chạy Trên Google Colab
1. Truy cập [Google Colab](https://colab.research.google.com/) và tạo Notebook mới.
2. Vào **Runtime** ➔ **Change runtime type** ➔ Chọn **T4 GPU**.
3. Tải file dataset **`balanced_intent_nar_dataset.json`** từ thư mục `data/dataset/` lên Colab (hoặc dùng Cell 3 bên dưới để nạp tự động).
4. Copy từng Cell bên dưới vào Colab và nhấn **Shift + Enter** để chạy.

---

### 🟢 Cell 1: Cài đặt các thư viện cần thiết

```python
!pip install -q transformers datasets accelerate torch pyvi scikit-learn pydantic
import torch
print(f"CUDA Available: {torch.cuda.is_available()}")
if torch.cuda.is_available():
    print(f"Device Name: {torch.cuda.get_device_name(0)}")
```

---

### 🟢 Cell 2: Định nghĩa Data Schema (Intent & Entities & NLU Result)

```python
import re
import json
import random
import numpy as np
from enum import Enum
from typing import List, Dict, Optional
from pydantic import BaseModel, Field

class IntentType(str, Enum):
    ASK_SPECS = "ask_specs"                    # Hỏi thông số kỹ thuật
    COMPARE_PRODUCTS = "compare_products"      # So sánh sản phẩm
    ASK_PRICE = "ask_price"                    # Hỏi giá bán
    ASK_WARRANTY = "ask_warranty"              # Hỏi bảo hành
    PURCHASE_CONSULTATION = "purchase_consultation" # Tư vấn chọn mua
    ASK_PROMOTION = "ask_promotion"            # Hỏi khuyến mãi
    ORDER_PRODUCT = "order_product"            # Đặt mua hàng
    COMPLAIN = "complain"                      # Khiếu nại / lỗi sản phẩm
    GENERAL_QUERY = "general_query"            # Hỏi đáp chung
    OUT_OF_SCOPE = "out_of_scope"              # Câu hỏi ngoài phạm vi (OOS)

class EntityType(str, Enum):
    PRODUCT_NAME = "PRODUCT_NAME"
    BRAND = "BRAND"
    MODEL = "MODEL"
    PRICE = "PRICE"
    SPEC = "SPEC"

class ExtractedEntity(BaseModel):
    text: str
    entity_type: EntityType
    start_char: int
    end_char: int
    confidence: float = 1.0

class NLUResult(BaseModel):
    original_query: str
    intent: IntentType
    confidence: float
    is_out_of_scope: bool
    entities: List[ExtractedEntity] = []
    intent_scores: Optional[Dict[str, float]] = None
```

---

### 🟢 Cell 3: Nạp Tập Dữ Liệu Thực Tế `balanced_intent_nar_dataset.json` & Bổ Sung Out-of-Scope (OOS)

```python
import os
from google.colab import files

# Kiểm tra nếu file đã tải lên Colab chưa, nếu chưa sẽ mở popup cho phép upload file
DATASET_FILENAME = "balanced_intent_nar_dataset.json"

if not os.path.exists(DATASET_FILENAME):
    print(f"⚠️ Chưa tìm thấy {DATASET_FILENAME}. Vui lòng chọn file 'balanced_intent_nar_dataset.json' để tải lên:")
    uploaded = files.upload()

with open(DATASET_FILENAME, "r", encoding="utf-8") as f:
    raw_dataset = json.load(f)

print(f"✅ Đã nạp thành công {len(raw_dataset)} mẫu dữ liệu thực tế từ {DATASET_FILENAME}")

# Thêm tập mẫu Out-of-Scope (OOS) để huấn luyện nhận diện câu hỏi lạc đề
oos_samples = [
    "Hôm nay thời tiết Hà Nội thế nào?",
    "Cách nấu món canh chua cá lóc ngon nhất?",
    "Thủ đô của nước Pháp là gì?",
    "Cho tôi công thức làm bánh mì Việt Nam",
    "Bạn có biết tính đạo hàm của hàm số này không?",
    "Ai là tổng thống đời thứ 16 của Hoa Kỳ?",
    "Làm sao để đăng ký tài khoản ngân hàng?",
    "Kể cho tôi nghe một câu chuyện cổ tích",
    "Tỷ giá USD hôm nay là bao nhiêu?",
    "Viết giúp tôi bài thơ về mùa thu",
    "Cách trồng cây kim tiền trong nhà",
    "Phim gì đang chiếu rạp hôm nay?"
]

# Nhân bản mẫu OOS để đạt độ cân bằng (~120 mẫu OOS)
for _ in range(10):
    for oos_text in oos_samples:
        raw_dataset.append({
            "source": "oos_synthetic",
            "text": oos_text,
            "intent": "out_of_scope"
        })

random.shuffle(raw_dataset)

# Thống kê phân bố nhãn
from collections import Counter
counts = Counter([item["intent"] for item in raw_dataset])
print("\n📊 Phân bố Intent sau khi tổng hợp:")
for intent_name, count in counts.most_common():
    print(f"  - {intent_name:25s}: {count:4d} mẫu ({round(count/len(raw_dataset)*100, 2)}%)")
```

---

### 🟢 Cell 4: Tiền Xử Lý Dữ Liệu Tách Từ tiếng Việt (PyVi Word Segmentation)

```python
from pyvi import ViTokenizer

def preprocess_text(text: str) -> str:
    # Tách từ tiếng Việt thích ứng với PhoBERT (vd: "laptop cao cấp" -> "laptop cao_cấp")
    return ViTokenizer.tokenize(text)

# Kiểm tra xử lý mẫu
sample_text = "Tôi muốn tư vấn mua laptop Asus TUF Gaming giá dưới 20 triệu"
print("Gốc:", sample_text)
print("Sau khi tách từ PyVi:", preprocess_text(sample_text))

# Tiền xử lý toàn bộ dataset
processed_texts = [preprocess_text(item["text"]) for item in raw_dataset]
intents = [item["intent"] for item in raw_dataset]

# Lập danh sách nhãn Intent
intent_labels = [i.value for i in IntentType]
label2id = {label: i for i, label in enumerate(intent_labels)}
id2label = {i: label for i, label in enumerate(intent_labels)}

labels_id = [label2id[intent] for intent in intents]
```

---

### 🟢 Cell 5: Fine-tuning PhoBERT với PyTorch & HuggingFace Trainer

```python
from transformers import AutoTokenizer, AutoModelForSequenceClassification, Trainer, TrainingArguments
from datasets import Dataset
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_recall_fscore_support

# Chia tập train (80%) và val/test (20%)
train_texts, val_texts, train_labels, val_labels = train_test_split(
    processed_texts, labels_id, test_size=0.2, random_state=42, stratify=labels_id
)

model_name = "vinai/phobert-base-v2"
print(f"Nạp Tokenizer & Model Pre-trained: {model_name}...")

tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForSequenceClassification.from_pretrained(
    model_name,
    num_labels=len(intent_labels),
    id2label=id2label,
    label2id=label2id
)

def tokenize_function(examples):
    return tokenizer(examples["text"], padding="max_length", truncation=True, max_length=128)

train_dataset = Dataset.from_dict({"text": train_texts, "label": train_labels}).map(tokenize_function, batched=True)
val_dataset = Dataset.from_dict({"text": val_texts, "label": val_labels}).map(tokenize_function, batched=True)

def compute_metrics(pred):
    preds = np.argmax(pred.predictions, axis=1)
    labels = pred.label_ids
    precision, recall, f1, _ = precision_recall_fscore_support(labels, preds, average='weighted')
    acc = accuracy_score(labels, preds)
    return {"accuracy": acc, "f1": f1, "precision": precision, "recall": recall}

training_args = TrainingArguments(
    output_dir="./phobert_electronics_nlu",
    num_train_epochs=4,
    per_device_train_batch_size=16,
    per_device_eval_batch_size=16,
    logging_steps=20,
    eval_strategy="epoch",
    save_strategy="epoch",
    learning_rate=3e-5,
    save_total_limit=1,
    load_best_model_at_end=True,
    metric_for_best_model="f1"
)

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=train_dataset,
    eval_dataset=val_dataset,
    compute_metrics=compute_metrics
)

print("🚀 Bắt đầu quá trình Fine-tuning PhoBERT trên GPU Colab...")
trainer.train()
print("✅ Fine-tuning hoàn tất thành công 100%!")
```

---

### 🟢 Cell 6: Bộ Trích Xuất Thực Thể Sản Phẩm (Regex & Rule-based NER Engine)

```python
RULE_BRANDS = ["Asus", "Dell", "Apple", "Lenovo", "HP", "Acer", "MSI", "Samsung", "LG", "Gigabyte", "Macbook"]
RULE_MODELS = [
    "TUF Gaming", "ROG Strix", "ROG", "XPS 13", "XPS 15", "XPS", "Inspiron", "Latitude",
    "Macbook Air", "Macbook Pro", "M1", "M2", "M3", "Legion 5", "Legion 7", "Slim 7", "Ideapad",
    "Vivobook", "Zenbook", "Nitro 5", "Predator", "Katana 15", "Stealth", "Gram 14", "Gram 16", "Victus"
]
RULE_SPECS_PATTERNS = [
    r"(?i)\bRAM\s*\d+\s*(?:GB|MB)?\b",
    r"(?i)\bSSD\s*\d+\s*(?:GB|TB)?\b",
    r"(?i)\bRTX\s*\d{4}(?:\s*Ti)?\b",
    r"(?i)\bCore\s*i[3579]\b|\bi[3579]\s*\d{4,5}[A-Z]*\b",
    r"(?i)\bRyzen\s*[3579]\s*\d{4}[A-Z]*\b",
    r"(?i)\bApple\s*M[123](?:\s*(?:Pro|Max))?\b",
    r"(?i)\bOLED\b|\b120Hz\b|\b144Hz\b|\b165Hz\b|\b2K\b|\b4K\b|\bFHD\b"
]
RULE_PRICE_PATTERNS = [
    r"(?i)\b\d+(?:\.\d+)?\s*(?:triệu|tr|tỷ|trăm|ngàn|k|vnđ|đ)\b",
    r"(?i)\b(?:dưới|tầm|khoảng|trên|từ)\s*\d+\s*(?:triệu|tr|trăm|k)?\b"
]

def extract_entities(text: str) -> List[ExtractedEntity]:
    entities = []
    # 1. BRAND
    for brand in RULE_BRANDS:
        match = re.search(r"\b" + re.escape(brand) + r"\b", text, re.IGNORECASE)
        if match:
            entities.append(ExtractedEntity(
                text=match.group(0), entity_type=EntityType.BRAND,
                start_char=match.start(), end_char=match.end(), confidence=0.98
            ))
    # 2. MODEL
    for m in RULE_MODELS:
        match = re.search(r"\b" + re.escape(m) + r"\b", text, re.IGNORECASE)
        if match and not any(e.start_char <= match.start() < e.end_char for e in entities):
            entities.append(ExtractedEntity(
                text=match.group(0), entity_type=EntityType.MODEL,
                start_char=match.start(), end_char=match.end(), confidence=0.95
            ))
    # 3. SPEC
    for spec_pat in RULE_SPECS_PATTERNS:
        for match in re.finditer(spec_pat, text):
            if not any(e.start_char <= match.start() < e.end_char for e in entities):
                entities.append(ExtractedEntity(
                    text=match.group(0), entity_type=EntityType.SPEC,
                    start_char=match.start(), end_char=match.end(), confidence=0.92
                ))
    # 4. PRICE
    for price_pat in RULE_PRICE_PATTERNS:
        for match in re.finditer(price_pat, text):
            if not any(e.start_char <= match.start() < e.end_char for e in entities):
                entities.append(ExtractedEntity(
                    text=match.group(0), entity_type=EntityType.PRICE,
                    start_char=match.start(), end_char=match.end(), confidence=0.90
                ))
    entities.sort(key=lambda x: x.start_char)
    return entities
```

---

### 🟢 Cell 7: Cơ Chế Out-of-Scope (OOS) Detection & Predict NLU Function

```python
def predict_nlu(query: str, confidence_threshold: float = 0.65) -> NLUResult:
    # 1. Tách từ bằng PyVi
    processed_query = preprocess_text(query)
    
    # 2. Inference qua PhoBERT
    inputs = tokenizer(processed_query, return_tensors="pt", truncation=True, max_length=128).to(model.device)
    with torch.no_grad():
        outputs = model(**inputs)
        probs = torch.softmax(outputs.logits, dim=-1).squeeze().cpu().numpy()
    
    best_idx = int(np.argmax(probs))
    confidence = float(probs[best_idx])
    predicted_intent_str = id2label[best_idx]
    
    # 3. Cơ chế Out-of-Scope (OOS) Detection:
    # Nếu Intent đoán là 'out_of_scope' HOẶC độ tin cậy < 0.65 -> Đánh dấu OOS để chống Hallucination
    is_oos = False
    if predicted_intent_str == IntentType.OUT_OF_SCOPE.value or confidence < confidence_threshold:
        intent_res = IntentType.OUT_OF_SCOPE
        is_oos = True
    else:
        intent_res = IntentType(predicted_intent_str)
        
    # 4. Trích xuất Thực thể NER
    entities = extract_entities(query)
    
    intent_scores = {id2label[i]: float(round(probs[i], 4)) for i in range(len(id2label))}
    
    return NLUResult(
        original_query=query,
        intent=intent_res,
        confidence=round(confidence, 4),
        is_out_of_scope=is_oos,
        entities=entities,
        intent_scores=intent_scores
    )
```

---

### 🟢 Cell 8: Kiểm Thử Đánh Giá Thực Tế (Inference Test)

```python
test_queries = [
    # Câu hỏi đúng domain công nghệ
    "Cấu hình chi tiết của laptop Asus TUF Gaming F15 như thế nào?",
    "Tầm 20 triệu mua laptop Dell hay Lenovo ngon hơn?",
    "Shop có giảm giá cho sinh viên khi mua Macbook Air M2 không?",
    "Máy laptop MSI Katana bị lỗi màn hình xanh đổi trả sao ạ?",
    "Cho mình hỏi máy này được bảo hành mấy năm shop ơi?",
    "Mình muốn đặt mua 1 chiếc Macbook Air M2 giao về Hà Nội",
    
    # Câu hỏi ngoài phạm vi (Out-of-Scope)
    "Hôm nay trời Hà Nội có mưa không shop?",
    "Hướng dẫn cách nấu món phở bò Nam Định chuẩn vị",
    "Cho mình hỏi bài thơ Sóng của Xuân Quỳnh có bao nhiêu khổ?"
]

print("="*80)
print("🔥 KẾT QUẢ ĐÁNH GIÁ NLU & PHÁT HIỆN OUT-OF-SCOPE")
print("="*80)

for query in test_queries:
    res = predict_nlu(query)
    print(f"\n📝 Câu hỏi: '{res.original_query}'")
    print(f"🎯 Intent: {res.intent.value.upper()} (Confidence: {res.confidence*100:.2f}%)")
    print(f"🛡️ Is Out-of-Scope?: {'❌ YES (Từ chối trả lời)' if res.is_out_of_scope else '✅ NO (Hợp lệ)'}")
    print(f"🏷️ Thực thể (NER): {[f'{e.entity_type.value}: {e.text}' for e in res.entities]}")
    print("-" * 50)
```

---

### 🟢 Cell 9: Xuất Model Checkpoint Tải Về Máy / Lưu Vào Google Drive

```python
from google.colab import files
import shutil

# Lưu model checkpoint và tokenizer
export_dir = "./phobert_electronics_nlu_final"
model.save_pretrained(export_dir)
tokenizer.save_pretrained(export_dir)

# Nén zip thành 1 file duy nhất để download về máy local
shutil.make_archive("phobert_electronics_nlu", 'zip', export_dir)

print("📦 Đã nén thành công phobert_electronics_nlu.zip!")
# Tải file về máy tính
files.download("phobert_electronics_nlu.zip")
```
