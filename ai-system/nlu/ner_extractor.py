"""
Module trích xuất thực thể (NER - Named Entity Recognition) cho sản phẩm công nghệ.
Hỗ trợ trích xuất BRAND, PRODUCT_NAME, MODEL, PRICE, SPEC từ câu hỏi tiếng Việt.
"""
import re
import logging
from typing import List

from nlu.schema import EntityType, ExtractedEntity

logger = logging.getLogger(__name__)

# Danh sách thương hiệu phổ biến trong e-commerce điện tử
KNOWN_BRANDS = [
    "asus", "dell", "hp", "lenovo", "apple", "macbook", "acer", "msi",
    "samsung", "xiaomi", "lg", "gigabyte", "logitech", "razer", "sony"
]

# Pattern nhận diện giá tiền (vd: 20 triệu, 15tr, 500k, 25.000.000đ)
PRICE_PATTERN = re.compile(
    r'(\d+[\d\.,]*\s*(?:triệu|tr|trđ|k|trieu|đồng|đ|vnd))',
    re.IGNORECASE
)

# Pattern nhận diện thông số kỹ thuật (vd: RAM 16GB, RTX 4060, SSD 512GB, 120Hz, Core i7)
SPEC_PATTERN = re.compile(
    r'\b(ram\s*\d+\s*gb|ssd\s*\d+\s*(?:gb|tb)|rtx\s*\d{4}|gtx\s*\d{4}|intel\s*core\s*i[3579]|ryzen\s*[3579]|\d+\s*hz|\d+\.?\d*\s*inch)\b',
    re.IGNORECASE
)


class NERExtractor:
    def __init__(self):
        pass

    def extract(self, text: str) -> List[ExtractedEntity]:
        """
        Trích xuất các thực thể từ đoạn văn bản người dùng.
        """
        if not text or not text.strip():
            return []

        entities: List[ExtractedEntity] = []
        text_lower = text.lower()

        # 1. Trích xuất Brand
        for brand in KNOWN_BRANDS:
            start = text_lower.find(brand)
            if start != -1:
                end = start + len(brand)
                original_text = text[start:end]
                entities.append(
                    ExtractedEntity(
                        text=original_text,
                        entity_type=EntityType.BRAND,
                        start_char=start,
                        end_char=end,
                        confidence=0.95,
                    )
                )

        # 2. Trích xuất Mức giá
        for match in PRICE_PATTERN.finditer(text):
            entities.append(
                ExtractedEntity(
                    text=match.group(0),
                    entity_type=EntityType.PRICE,
                    start_char=match.start(),
                    end_char=match.end(),
                    confidence=0.90,
                )
            )

        # 3. Trích xuất Thông số (Spec)
        for match in SPEC_PATTERN.finditer(text):
            entities.append(
                ExtractedEntity(
                    text=match.group(0),
                    entity_type=EntityType.SPEC,
                    start_char=match.start(),
                    end_char=match.end(),
                    confidence=0.88,
                )
            )

        return entities


_ner_instance = None


def get_ner_extractor() -> NERExtractor:
    global _ner_instance
    if _ner_instance is None:
        _ner_instance = NERExtractor()
    return _ner_instance
