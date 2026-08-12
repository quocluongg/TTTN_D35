"""Rule-based NLU engine: fast regex intent classification + NER extraction.

Runs in <2ms. Used as fast-path before PhoBERT fallback.
"""
import re
from typing import List

from ai.nlu.schema import EntityType, ExtractedEntity, IntentType, NLUResult

# --- Entity dictionaries ---
BRANDS = [
    "Asus", "Dell", "Apple", "Lenovo", "HP", "Acer", "MSI", "Samsung", "LG",
    "Gigabyte", "Macbook", "Xiaomi", "Oppo", "Vivo", "Realme", "Sony", "JBL",
]

MODELS = [
    "TUF Gaming", "ROG Strix", "ROG", "XPS 13", "XPS 15", "XPS", "Inspiron", "Latitude",
    "Macbook Air", "Macbook Pro", "M1", "M2", "M3", "M4", "Legion 5", "Legion 7",
    "Slim 7", "Ideapad", "Vivobook", "Zenbook", "Nitro 5", "Predator", "Katana 15",
    "Stealth", "Gram 14", "Gram 16", "Victus", "Galaxy S24", "Galaxy S25",
    "iPhone 15", "iPhone 16", "iPad Pro", "iPad Air", "AirPods", "Mac Mini",
]

SPEC_PATTERNS = [
    r"(?i)\bRAM\s*\d+\s*(?:GB|MB)?\b",
    r"(?i)\bSSD\s*\d+\s*(?:GB|TB)?\b",
    r"(?i)\bHDD\s*\d+\s*(?:GB|TB)?\b",
    r"(?i)\bRTX\s*\d{4}(?:\s*Ti)?\b",
    r"(?i)\bGTX\s*\d{4}(?:\s*Ti)?\b",
    r"(?i)\bCore\s*i[3579]\b|\bi[3579]\s*\d{4,5}[A-Z]*\b",
    r"(?i)\bRyzen\s*[3579]\s*\d{4}[A-Z]*\b",
    r"(?i)\bApple\s*M[1234](?:\s*(?:Pro|Max))?\b",
    r"(?i)\bOLED\b|\b120Hz\b|\b144Hz\b|\b165Hz\b|\b2K\b|\b4K\b|\bFHD\b|\bQHD\b",
    r"(?i)\b\d+(?:\.\d+)?\s*(?:inch|\")\b",
]

PRICE_PATTERNS = [
    r"(?i)\b\d+(?:\.\d+)?\s*(?:triệu|tr|tỷ|trăm|ngàn|k|vnđ|đ)\b",
    r"(?i)\b(?:dưới|tầm|khoảng|trên|từ)\s*\d+\s*(?:triệu|tr|trăm|k)?\b",
]

# Greeting pattern — checked first, has priority
GREETING_PATTERN = re.compile(
    r"^(da\s*)?(dạ\s*)?(xin chào|xin chao|chào bạn|chao ban|chào em|chao em|"
    r"chào shop|chao shop|chào|chao|hi shop|hello|hi|alo|shop ơi|shop oi|helo|hey)\b",
    re.IGNORECASE,
)

# Out-of-scope topics
OOS_PATTERNS = re.compile(
    r"thời tiết|thoi tiet|chính trị|chinh tri|bóng đá|bong da|thể thao|the thao|"
    r"nấu ăn|nau an|âm nhạc|am nhac|ca sĩ|ca si|phim|game(?!.*(?:laptop|pc|gaming))",
    re.IGNORECASE,
)


def strip_vietnamese_accents(text: str) -> str:
    """Remove Vietnamese diacritics for pattern matching."""
    patterns = {
        "[àáảãạăằắẳẵặâầấẩẫậ]": "a",
        "[đ]": "d",
        "[èéẻẽẹêềếểễệ]": "e",
        "[ìíỉĩị]": "i",
        "[òóỏõọôồốổỗộơờớởỡợ]": "o",
        "[ùúủũụưừứửữự]": "u",
        "[ỳýỷỹỵ]": "y",
    }
    output = text
    for pattern, replace in patterns.items():
        output = re.sub(pattern, replace, output, flags=re.IGNORECASE)
    return output


class RuleEngine:
    """Fast regex-based intent classifier + NER extractor."""

    def parse(self, text: str) -> NLUResult:
        query_lower = text.lower()
        query_no_accent = strip_vietnamese_accents(query_lower)

        # 1. Greeting check (priority — skip other intents)
        intent = IntentType.GENERAL_QUERY
        confidence = 0.85

        if GREETING_PATTERN.search(query_no_accent.strip()):
            if not re.search(
                r"giá|bao nhiêu|thông số|cấu hình|so sánh|bảo hành|khuyến mãi|mua|tư vấn|gợi ý",
                query_no_accent,
            ):
                intent = IntentType.GREETING
                confidence = 0.99

        # 2. Intent classification (if not greeting)
        if intent != IntentType.GREETING:
            intent, confidence = self._classify_intent(query_no_accent)

        # 3. Entity extraction
        entities = self._extract_entities(text)

        return NLUResult(
            original_query=text,
            intent=intent,
            confidence=confidence,
            entities=entities,
            intent_scores={intent.value: confidence},
        )

    def _classify_intent(self, q: str) -> tuple:
        """Classify intent from accent-stripped query. Returns (intent, confidence)."""
        if re.search(
            r"khiếu nại|hỏng|bị lỗi|trầy xước|giao nhầm|hư|hu|hư rồi|không lên|"
            r"cháy|chập|lỗi|tệ|kém|chán|trả hàng",
            q,
        ):
            return IntentType.COMPLAIN, 0.95

        if re.search(
            r"bảo hành|đổi trả|bao lau|1 đổi 1|bao hanh|doi tra|trung tam bao hanh",
            q,
        ):
            return IntentType.ASK_WARRANTY, 0.94

        if re.search(
            r"khuyến mãi|ưu đãi|giảm giá|voucher|quà tặng|khuyen mai|giam gia|ma giam gia",
            q,
        ):
            return IntentType.ASK_PROMOTION, 0.93

        if re.search(
            r"đặt mua|mua ngay|order|thanh toán|dat mua|mua hang|dat hang|len don|tạo đơn",
            q,
        ):
            return IntentType.ORDER_PRODUCT, 0.91

        if re.search(r"so sánh|khác gì|nên mua.*hay|hơn hay|so sanh", q):
            return IntentType.COMPARE_PRODUCTS, 0.95

        if re.search(r"cấu hình|thông số|chip|ram|ssd|màn hình|cau hinh|thong so", q):
            return IntentType.ASK_SPECS, 0.92

        if re.search(r"giá bao nhiêu|báo giá|bao nhieu tien|gia bao nhieu|gia ca", q):
            return IntentType.ASK_PRICE, 0.95

        if re.search(r"tư vấn|gợi ý|nên mua|tầm gia|can mua|dưới \d+|duoi \d+", q):
            return IntentType.PURCHASE_CONSULTATION, 0.88

        if OOS_PATTERNS.search(q):
            return IntentType.OUT_OF_SCOPE, 0.95

        return IntentType.GENERAL_QUERY, 0.85

    def _extract_entities(self, text: str) -> List[ExtractedEntity]:
        """Extract NER entities from original text (preserves case)."""
        entities: List[ExtractedEntity] = []

        # BRAND
        for brand in BRANDS:
            match = re.search(r"\b" + re.escape(brand) + r"\b", text, re.IGNORECASE)
            if match:
                entities.append(
                    ExtractedEntity(
                        text=match.group(0),
                        entity_type=EntityType.BRAND,
                        start_char=match.start(),
                        end_char=match.end(),
                        confidence=0.98,
                    )
                )

        # MODEL (avoid overlapping with BRAND)
        for model in MODELS:
            match = re.search(r"\b" + re.escape(model) + r"\b", text, re.IGNORECASE)
            if match:
                if not any(e.start_char <= match.start() < e.end_char for e in entities):
                    entities.append(
                        ExtractedEntity(
                            text=match.group(0),
                            entity_type=EntityType.MODEL,
                            start_char=match.start(),
                            end_char=match.end(),
                            confidence=0.95,
                        )
                    )

        # SPEC
        for pattern in SPEC_PATTERNS:
            for match in re.finditer(pattern, text):
                if not any(e.start_char <= match.start() < e.end_char for e in entities):
                    entities.append(
                        ExtractedEntity(
                            text=match.group(0),
                            entity_type=EntityType.SPEC,
                            start_char=match.start(),
                            end_char=match.end(),
                            confidence=0.92,
                        )
                    )

        # PRICE
        for pattern in PRICE_PATTERNS:
            for match in re.finditer(pattern, text):
                if not any(e.start_char <= match.start() < e.end_char for e in entities):
                    entities.append(
                        ExtractedEntity(
                            text=match.group(0),
                            entity_type=EntityType.PRICE,
                            start_char=match.start(),
                            end_char=match.end(),
                            confidence=0.90,
                        )
                    )

        entities.sort(key=lambda x: x.start_char)
        return entities
