"""
Module trích xuất thực thể (NER - Named Entity Recognition) cho sản phẩm công nghệ.
Hỗ trợ trích xuất BRAND, PRODUCT_NAME, MODEL, PRICE, SPEC từ câu hỏi tiếng Việt.

Bao gồm:
- NERExtractor: class-based interface (dùng trong pipeline NLU)
- extract_entities(): standalone function (dùng cho unit test / gọi trực tiếp)
"""
import re
import logging
from typing import List

from config.constants import EntityType, ExtractedEntity

logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────────────────────────────
# Brand patterns (case-insensitive)
# ──────────────────────────────────────────────────────────────────────
BRAND_PATTERNS = [
    re.compile(
        r'\b(ASUS|ACER|DELL|HP|LENOVO|MSI|APPLE|MACBOOK|SAMSUNG|XIAOMI|OPPO|VIVO|REALME)\b',
        re.IGNORECASE,
    ),
    re.compile(
        r'\b(Razer|Microsoft|LG|Sony|JBL|Anker|Logitech|Gigabyte)\b',
        re.IGNORECASE,
    ),
]

# ──────────────────────────────────────────────────────────────────────
# Spec attribute patterns — nhận diện nhóm thông số kỹ thuật
# ──────────────────────────────────────────────────────────────────────
SPEC_PATTERNS = [
    (re.compile(r'\b(RAM|ROM|SSD|HDD|NVMe)\s*\d*\s*(GB|TB)?\b', re.IGNORECASE), 'MEMORY'),
    (re.compile(r'\b(CPU|GPU|chip|processor)\b', re.IGNORECASE), 'PROCESSOR'),
    (re.compile(r'\b(RTX|GTX)\s*\d{4,5}\b', re.IGNORECASE), 'GPU_MODEL'),
    (re.compile(r'\b(Intel\s*Core\s*i[3-9]|Ryzen\s*[3-9])\b', re.IGNORECASE), 'CPU_MODEL'),
    (re.compile(r'\b(màn hình|display|screen)\b', re.IGNORECASE), 'DISPLAY'),
    (re.compile(r'\b(\d+\.?\d*)\s*(inch|")\b', re.IGNORECASE), 'DISPLAY_SIZE'),
    (re.compile(r'\b(\d+)\s*Hz\b', re.IGNORECASE), 'REFRESH_RATE'),
    (re.compile(r'\b(pin|battery|sạc|charger)\b', re.IGNORECASE), 'BATTERY'),
    (re.compile(r'\b(camera|webcam)\b', re.IGNORECASE), 'CAMERA'),
    (re.compile(r'\b(bàn phím|keyboard|chuột|mouse)\b', re.IGNORECASE), 'PERIPHERAL'),
]

# ──────────────────────────────────────────────────────────────────────
# Price patterns — nhận diện khoảng giá / mức giá
# ──────────────────────────────────────────────────────────────────────
PRICE_PATTERNS = [
    re.compile(r'(\d+[\.,]?\d*)\s*(triệu|tr|trđ|k|nghìn)\b', re.IGNORECASE),
    re.compile(r'giá\s*(\d+[\.,]?\d*)', re.IGNORECASE),
    re.compile(r'(\d+[\.,]?\d*)\s*(VND|đ|₫)', re.IGNORECASE),
]


# ──────────────────────────────────────────────────────────────────────
# Standalone function — interface chính cho unit test và gọi trực tiếp
# ──────────────────────────────────────────────────────────────────────
def extract_entities(query: str) -> List[ExtractedEntity]:
    """
    Trích xuất các thực thể (brand, spec, price, product_name) từ câu hỏi tiếng Việt.

    Args:
        query: Câu hỏi / văn bản tiếng Việt đầu vào.

    Returns:
        Danh sách ExtractedEntity đã trích xuất.
    """
    if not query or not query.strip():
        return []

    entities: List[ExtractedEntity] = []

    # 1. Extract brands
    for pattern in BRAND_PATTERNS:
        for match in pattern.finditer(query):
            entities.append(ExtractedEntity(
                text=match.group(1).upper(),
                entity_type=EntityType.BRAND,
                start_char=match.start(),
                end_char=match.end(),
                confidence=0.95,
            ))

    # 2. Extract spec attributes
    for pattern, _category in SPEC_PATTERNS:
        for match in pattern.finditer(query):
            entities.append(ExtractedEntity(
                text=match.group(0).upper(),
                entity_type=EntityType.SPEC,
                start_char=match.start(),
                end_char=match.end(),
                confidence=0.90,
            ))

    # 3. Extract price ranges
    for pattern in PRICE_PATTERNS:
        for match in pattern.finditer(query):
            entities.append(ExtractedEntity(
                text=match.group(0),
                entity_type=EntityType.PRICE,
                start_char=match.start(),
                end_char=match.end(),
                confidence=0.85,
            ))

    # 4. Extract product names (heuristic: words after brand)
    for brand_entity in [e for e in entities if e.entity_type == EntityType.BRAND]:
        after_brand = query[brand_entity.end_char:]
        name_match = re.match(
            r'\s+([A-Z0-9][\w\s]+?)(?:\s+(?:có|với|giá|RAM|CPU|SSD)|$)',
            after_brand,
            re.IGNORECASE,
        )
        if name_match:
            product_name = name_match.group(1).strip()
            if len(product_name) > 3:
                entities.append(ExtractedEntity(
                    text=product_name,
                    entity_type=EntityType.PRODUCT_NAME,
                    start_char=brand_entity.end_char + name_match.start(1),
                    end_char=brand_entity.end_char + name_match.end(1),
                    confidence=0.80,
                ))

    return entities


# ──────────────────────────────────────────────────────────────────────
# Class-based interface — giữ tương thích ngược với query_processor.py
# ──────────────────────────────────────────────────────────────────────
class NERExtractor:
    def __init__(self):
        pass

    def extract(self, text: str) -> List[ExtractedEntity]:
        """Trích xuất các thực thể từ đoạn văn bản người dùng (delegates to extract_entities)."""
        return extract_entities(text)


_ner_instance = None


def get_ner_extractor() -> NERExtractor:
    global _ner_instance
    if _ner_instance is None:
        _ner_instance = NERExtractor()
    return _ner_instance
