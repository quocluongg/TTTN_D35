import os
import re
import sys
import logging
from typing import List, Dict, Tuple, Optional

# Đảm bảo import được schema
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from nlu.schema import IntentType, EntityType, ExtractedEntity, NLUResult

# Đường dẫn lưu Model Checkpoint trên ổ D
MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "models", "phobert_electronics_nlu")

# Từ điển thực thể cơ bản cho Rule-based Pattern Engine
RULE_BRANDS = ["Asus", "Dell", "Apple", "Lenovo", "HP", "Acer", "MSI", "Samsung", "LG", "Gigabyte", "Macbook"]
RULE_MODELS = [
    "TUF Gaming", "ROG Strix", "ROG", "XPS 13", "XPS 15", "XPS", "Inspiron", "Latitude",
    "Macbook Air", "Macbook Pro", "M1", "M2", "M3", "Legion 5", "Legion 7", "Slim 7", "Ideapad",
    "Vivobook", "Zenbook", "Nitro 5", "Predator", "Katana 15", "Stealth", "Gram 14", "Gram 16", "Victus"
]
RULE_SPECS_PATTERNS = [
    r"(?i)\bRAM\s*\d+\s*(?:GB|MB)?\b",
    r"(?i)\bSSD\s*\d+\s*(?:GB|TB)?\b",
    r"(?i)\bHDD\s*\d+\s*(?:GB|TB)?\b",
    r"(?i)\bRTX\s*\d{4}(?:\s*Ti)?\b",
    r"(?i)\bGTX\s*\d{4}(?:\s*Ti)?\b",
    r"(?i)\bCore\s*i[3579]\b|\bi[3579]\s*\d{4,5}[A-Z]*\b",
    r"(?i)\bRyzen\s*[3579]\s*\d{4}[A-Z]*\b",
    r"(?i)\bApple\s*M[123](?:\s*(?:Pro|Max))?\b",
    r"(?i)\bOLED\b|\b120Hz\b|\b144Hz\b|\b165Hz\b|\b2K\b|\b4K\b|\bFHD\b",
]
RULE_PRICE_PATTERNS = [
    r"(?i)\b\d+(?:\.\d+)?\s*(?:triệu|tr|tỷ|trăm|ngàn|k|vnđ|đ)\b",
    r"(?i)\b(?:dưới|tầm|khoảng|trên|từ)\s*\d+\s*(?:triệu|tr|trăm|k)?\b",
]

def strip_vietnamese_accents(text: str) -> str:
    """Loại bỏ dấu tiếng Việt để so sánh khớp từ khóa"""
    patterns = {
        '[àáảãạăằắẳẵặâầấẩẫậ]': 'a',
        '[đ]': 'd',
        '[èéẻẽẹêềếểễệ]': 'e',
        '[ìíỉĩị]': 'i',
        '[òóỏõọôồốổỗộơờớởỡợ]': 'o',
        '[ùúủũụưừứửữự]': 'u',
        '[ỳýỷỹỵ]': 'y'
    }
    output = text
    for pattern, replace in patterns.items():
        output = re.sub(pattern, replace, output, flags=re.IGNORECASE)
    return output


class RuleBasedNLUEngine:
    """
    Pattern Engine khớp Intent & NER cực nhanh bằng Luật/Regex (< 2ms).
    Được sử dụng làm Fallback khi PhoBERT chưa nạp xong hoặc phục vụ kiểm thử nhanh.
    """
    def __init__(self):
        pass

    def parse(self, text: str) -> NLUResult:
        query_lower = text.lower()
        query_no_accent = strip_vietnamese_accents(query_lower)

        # 1. Nhận diện Intent
        intent = IntentType.GENERAL_QUERY
        confidence = 0.85

        if re.search(r"so sánh|khác gì|nên mua.*hay|hơn hay|so sanh", query_no_accent):
            intent = IntentType.COMPARE_PRODUCTS
            confidence = 0.95
        elif re.search(r"cấu hình|thông số|chip|ram|ssd|màn hình|cau hinh|thong so", query_no_accent):
            intent = IntentType.ASK_SPECS
            confidence = 0.92
        elif re.search(r"bảo hành|đổi trả|bao lau|1 đổi 1|bao hanh|doi tra", query_no_accent):
            intent = IntentType.ASK_WARRANTY
            confidence = 0.94
        elif re.search(r"khuyến mãi|ưu đãi|giảm giá|voucher|quà tặng|khuyen mai|giam gia", query_no_accent):
            intent = IntentType.ASK_PROMOTION
            confidence = 0.93
        elif re.search(r"giá bao nhiêu|báo giá|bao nhieu tien|gia bao nhieu|gia ca", query_no_accent):
            intent = IntentType.ASK_PRICE
            confidence = 0.95
        elif re.search(r"đặt mua|mua ngay|order|thanh toán|dat mua|mua hang", query_no_accent):
            intent = IntentType.ORDER_PRODUCT
            confidence = 0.91
        elif re.search(r"khiếu nại|hỏng|bị lỗi|trầy xước|giao nhầm|khieu nai|bi loi", query_no_accent):
            intent = IntentType.COMPLAIN
            confidence = 0.90
        elif re.search(r"tư vấn|gợi ý|nên mua|tầm gia|tam gia|can mua|dưới \d+|duoi \d+", query_no_accent):
            intent = IntentType.PURCHASE_CONSULTATION
            confidence = 0.88

        # 2. Trích xuất Thực thể NER (Slot Extraction)
        entities: List[ExtractedEntity] = []

        # Check BRAND
        for brand in RULE_BRANDS:
            match = re.search(r"\b" + re.escape(brand) + r"\b", text, re.IGNORECASE)
            if match:
                entities.append(ExtractedEntity(
                    text=match.group(0),
                    entity_type=EntityType.BRAND,
                    start_char=match.start(),
                    end_char=match.end(),
                    confidence=0.98
                ))

        # Check MODEL
        for model in RULE_MODELS:
            match = re.search(r"\b" + re.escape(model) + r"\b", text, re.IGNORECASE)
            if match:
                # Tránh đè lên BRAND
                if not any(e.start_char <= match.start() < e.end_char for e in entities):
                    entities.append(ExtractedEntity(
                        text=match.group(0),
                        entity_type=EntityType.MODEL,
                        start_char=match.start(),
                        end_char=match.end(),
                        confidence=0.95
                    ))

        # Check SPEC Regex
        for spec_pattern in RULE_SPECS_PATTERNS:
            for match in re.finditer(spec_pattern, text):
                if not any(e.start_char <= match.start() < e.end_char for e in entities):
                    entities.append(ExtractedEntity(
                        text=match.group(0),
                        entity_type=EntityType.SPEC,
                        start_char=match.start(),
                        end_char=match.end(),
                        confidence=0.92
                    ))

        # Check PRICE Regex
        for price_pattern in RULE_PRICE_PATTERNS:
            for match in re.finditer(price_pattern, text):
                if not any(e.start_char <= match.start() < e.end_char for e in entities):
                    entities.append(ExtractedEntity(
                        text=match.group(0),
                        entity_type=EntityType.PRICE,
                        start_char=match.start(),
                        end_char=match.end(),
                        confidence=0.90
                    ))

        entities.sort(key=lambda x: x.start_char)

        return NLUResult(
            original_query=text,
            intent=intent,
            confidence=confidence,
            entities=entities,
            intent_scores={intent.value: confidence}
        )


class PhoBERTElectronicsNLU:
    """
    PhoBERT Transformer NLU Engine chuyên ngành Điện tử.
    Hỗ trợ nạp model fine-tuned từ ổ D, tự động fallback sang Rule-based Engine khi khởi động.
    """
    def __init__(self, model_dir: str = MODEL_DIR):
        self.model_dir = model_dir
        self.fallback_engine = RuleBasedNLUEngine()
        self.is_transformer_loaded = False
        self.model = None
        self.tokenizer = None
        
        # Thử nạp Transformer model nếu đã có checkpoint
        self._load_transformer_if_available()

    def _load_transformer_if_available(self):
        if os.path.exists(os.path.join(self.model_dir, "config.json")):
            try:
                logging.info(f"[PhoBERT NLU] Dang nap trained model checkpoint tu: {self.model_dir}")
                from transformers import AutoTokenizer, AutoModelForSequenceClassification
                self.tokenizer = AutoTokenizer.from_pretrained(self.model_dir)
                self.model = AutoModelForSequenceClassification.from_pretrained(self.model_dir)
                self.is_transformer_loaded = True
                logging.info("[PhoBERT NLU] Da nap xong PhoBERT fine-tuned model!")
            except Exception as e:
                logging.warning(f"[PhoBERT NLU] Khong the nap PhoBERT model: {e}. Su dung Fallback Rule Engine.")
        else:
            logging.info(f"[PhoBERT NLU] Khong co checkpoint tai {self.model_dir} — dang dung Rule Engine.")

    def parse(self, text: str) -> NLUResult:
        if self.is_transformer_loaded and self.model and self.tokenizer:
            try:
                # Đoán Intent qua Transformer
                import torch
                inputs = self.tokenizer(text, return_tensors="pt", truncation=True, max_length=128)
                with torch.no_grad():
                    outputs = self.model(**inputs)
                    probs = torch.softmax(outputs.logits, dim=-1).squeeze().tolist()
                
                # Kết hợp thực thể từ Rule Engine / Slot Filler
                fallback_res = self.fallback_engine.parse(text)
                intents_list = list(IntentType)
                best_idx = probs.index(max(probs))
                
                return NLUResult(
                    original_query=text,
                    intent=intents_list[best_idx] if best_idx < len(intents_list) else fallback_res.intent,
                    confidence=round(max(probs), 4),
                    entities=fallback_res.entities,
                    intent_scores={intents_list[i].value: round(probs[i], 4) for i in range(min(len(intents_list), len(probs)))}
                )
            except Exception as e:
                logging.warning(f"[PhoBERT NLU Error] Inference fail: {e}. Fallback to Rule Engine.")
                return self.fallback_engine.parse(text)
        else:
            return self.fallback_engine.parse(text)
