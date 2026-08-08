"""NLU Module - PhoBERT Intent Classification + NER Extraction."""
import sys
import os
import re
import logging
from dataclasses import dataclass, field

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

logger = logging.getLogger(__name__)

# Intent labels from trained model
INTENT_LABELS = [
    "ask_specs",
    "compare_products",
    "ask_price",
    "ask_warranty",
    "purchase_consultation",
    "ask_promotion",
    "order_product",
    "complain",
    "general_query",
    "out_of_scope",
]

# Intent display names (Vietnamese)
INTENT_DISPLAY = {
    "ask_specs": "Hỏi thông số kỹ thuật",
    "compare_products": "So sánh sản phẩm",
    "ask_price": "Hỏi giá",
    "ask_warranty": "Hỏi bảo hành",
    "purchase_consultation": "Tư vấn chọn mua",
    "ask_promotion": "Hỏi khuyến mãi",
    "order_product": "Đặt hàng",
    "complain": "Khiếu nại",
    "general_query": "Câu hỏi chung",
    "out_of_scope": "Ngoài phạm vi",
}


@dataclass
class Entity:
    """Named Entity."""
    text: str
    entity_type: str  # BRAND, PRODUCT_NAME, SPEC, PRICE, CATEGORY
    start: int = 0
    end: int = 0
    confidence: float = 1.0


@dataclass
class NLUResult:
    """NLU analysis result."""
    query: str
    intent: str
    confidence: float
    entities: list[Entity] = field(default_factory=list)
    is_out_of_scope: bool = False
    intent_display: str = ""


# PhoBERT model (lazy loaded)
_classifier = None
_tokenizer = None


def _load_model():
    """Load PhoBERT NLU model."""
    global _classifier, _tokenizer

    if _classifier is not None:
        return

    try:
        from transformers import AutoTokenizer, AutoModelForSequenceClassification
        import torch

        model_name = "souta04/phobert-electronics-e-commerce-nlu"
        logger.info(f"Loading PhoBERT NLU model: {model_name}")

        _tokenizer = AutoTokenizer.from_pretrained(model_name)
        _classifier = AutoModelForSequenceClassification.from_pretrained(model_name)

        # Move to CPU
        _classifier.eval()
        logger.info("PhoBERT NLU model loaded successfully")

    except Exception as e:
        logger.warning(f"Failed to load PhoBERT model: {e}")
        logger.warning("Using rule-based fallback")
        _classifier = None
        _tokenizer = None


def classify_intent(query: str) -> tuple[str, float, dict[str, float]]:
    """
    Classify intent using PhoBERT model.

    Returns:
        (intent, confidence, all_scores)
    """
    _load_model()

    # Try PhoBERT model
    if _classifier is not None and _tokenizer is not None:
        try:
            import torch

            inputs = _tokenizer(
                query,
                return_tensors="pt",
                truncation=True,
                max_length=256,
                padding=True
            )

            with torch.no_grad():
                outputs = _classifier(**inputs)
                probs = torch.softmax(outputs.logits, dim=-1)[0]

            # Get all scores
            scores = {}
            for i, prob in enumerate(probs):
                label = INTENT_LABELS[i] if i < len(INTENT_LABELS) else f"intent_{i}"
                scores[label] = float(prob.item())

            # Get top intent
            top_idx = torch.argmax(probs).item()
            intent = INTENT_LABELS[top_idx] if top_idx < len(INTENT_LABELS) else "general_query"
            confidence = float(probs[top_idx].item())

            # Low confidence -> out_of_scope
            if confidence < 0.45:
                return "out_of_scope", confidence, scores

            return intent, confidence, scores

        except Exception as e:
            logger.error(f"PhoBERT inference failed: {e}")

    # Fallback: rule-based
    return _rule_based_intent(query)


def _rule_based_intent(query: str) -> tuple[str, float, dict[str, float]]:
    """Rule-based intent detection fallback."""
    q = query.lower()

    rules = [
        (["giá", "bao nhiêu", "tiền", "cost", "price", "đắt", "rẻ"], "ask_price", 0.85),
        (["so sánh", "khác gì", "vs", "compare", "hơn", "tốt hơn"], "compare_products", 0.85),
        (["ram", "cpu", "ssd", "gpu", "thông số", "specs", "cấu hình", "card"], "ask_specs", 0.85),
        (["bảo hành", "warranty", "đổi trả", "hư"], "ask_warranty", 0.85),
        (["tư vấn", "nên mua", "recommend", "gợi ý", "chọn", "phù hợp"], "purchase_consultation", 0.80),
        (["khuyến mãi", "giảm giá", "sale", "discount", "ưu đãi"], "ask_promotion", 0.80),
        (["đặt hàng", "mua", "order", "ship", "giao hàng"], "order_product", 0.80),
        (["khiếu nại", "phàn nàn", "complaint", "tệ", "dở"], "complain", 0.80),
    ]

    for keywords, intent, conf in rules:
        if any(k in q for k in keywords):
            return intent, conf, {intent: conf}

    return "general_query", 0.60, {"general_query": 0.60}


def extract_entities(query: str) -> list[Entity]:
    """Extract named entities from query."""
    entities = []

    # 1. Brand extraction
    brands = {
        "ASUS": ["asus"],
        "ACER": ["acer"],
        "DELL": ["dell"],
        "HP": ["hp"],
        "LENOVO": ["lenovo"],
        "MSI": ["msi"],
        "APPLE": ["apple", "macbook"],
        "SAMSUNG": ["samsung"],
        "XIAOMI": ["xiaomi"],
        "OPPO": ["oppo"],
        "VIVO": ["vivo"],
        "REALME": ["realme"],
    }

    q_lower = query.lower()
    for brand, keywords in brands.items():
        for kw in keywords:
            if kw in q_lower:
                start = q_lower.find(kw)
                entities.append(Entity(
                    text=brand,
                    entity_type="BRAND",
                    start=start,
                    end=start + len(kw),
                    confidence=0.95
                ))
                break

    # 2. Spec attribute extraction
    spec_patterns = [
        (r'\b(RAM|ram)\b', "RAM"),
        (r'\b(CPU|cpu|vi xử lý|chip)\b', "CPU"),
        (r'\b(SSD|ssd|ổ cứng|storage)\b', "STORAGE"),
        (r'\b(GPU|gpu|card đồ họa|vga|rtx|gtx)\b', "GPU"),
        (r'\b(màn hình|display|screen|inch)\b', "DISPLAY"),
        (r'\b(pin|battery|sạc)\b', "BATTERY"),
        (r'\b(bàn phím|keyboard)\b', "KEYBOARD"),
    ]

    for pattern, spec_type in spec_patterns:
        match = re.search(pattern, query, re.IGNORECASE)
        if match:
            entities.append(Entity(
                text=spec_type,
                entity_type="SPEC",
                start=match.start(),
                end=match.end(),
                confidence=0.90
            ))

    # 3. Price extraction
    price_patterns = [
        r'(\d+[\.,]?\d*)\s*(triệu|tr|k|nghìn)',
        r'giá\s*(\d+[\.,]?\d*)',
        r'(\d+[\.,]?\d*)\s*(VND|đ|₫)',
    ]

    for pattern in price_patterns:
        match = re.search(pattern, query, re.IGNORECASE)
        if match:
            entities.append(Entity(
                text=match.group(0),
                entity_type="PRICE",
                start=match.start(),
                end=match.end(),
                confidence=0.85
            ))

    # 4. Product name extraction (heuristic)
    # Look for product-like patterns: Brand + Model
    for brand_entity in [e for e in entities if e.entity_type == "BRAND"]:
        after_brand = query[brand_entity.end:]
        # Match model patterns like "Omnibook 5 AI", "250 G10", "ROG Strix"
        model_match = re.match(r'\s+([A-Z0-9][\w\s]+?)(?:\s+(?:có|với|giá|RAM|CPU|SSD)|$)', after_brand, re.IGNORECASE)
        if model_match:
            model = model_match.group(1).strip()
            if len(model) > 3:
                entities.append(Entity(
                    text=model,
                    entity_type="PRODUCT_NAME",
                    start=brand_entity.end + model_match.start(1),
                    end=brand_entity.end + model_match.end(1),
                    confidence=0.80
                ))

    return entities


def is_out_of_scope(query: str, intent: str, confidence: float) -> bool:
    """Check if query is out of scope."""
    # Low confidence
    if confidence < 0.45:
        return True

    # Explicit out_of_scope intent
    if intent == "out_of_scope":
        return True

    # Non-tech keywords
    non_tech = ["thời tiết", "chính trị", "tôn giáo", "thể thao", "bóng đá", "âm nhạc"]
    if any(k in query.lower() for k in non_tech):
        return True

    return False


def process_query(query: str) -> NLUResult:
    """Full NLU processing pipeline."""
    # 1. Classify intent
    intent, confidence, scores = classify_intent(query)

    # 2. Extract entities
    entities = extract_entities(query)

    # 3. Check out-of-scope
    oos = is_out_of_scope(query, intent, confidence)

    # 4. Get display name
    display = INTENT_DISPLAY.get(intent, intent)

    return NLUResult(
        query=query,
        intent=intent,
        confidence=confidence,
        entities=entities,
        is_out_of_scope=oos,
        intent_display=display,
    )


# Test function
def test_nlu():
    """Test NLU with sample queries."""
    test_queries = [
        "Laptop HP RAM bao nhiêu?",
        "Giá laptop ASUS bao nhiêu?",
        "So sánh HP và Dell",
        "Bảo hành laptop MSI?",
        "Tư vấn laptop gaming 20 triệu",
        "Có khuyến mãi không?",
        "Thời tiết hôm nay thế nào?",
    ]

    print("=" * 60)
    print("NLU TEST")
    print("=" * 60)

    for q in test_queries:
        result = process_query(q)
        print(f"\nQ: {q}")
        print(f"  Intent: {result.intent} ({result.intent_display})")
        print(f"  Confidence: {result.confidence:.2f}")
        print(f"  OOS: {result.is_out_of_scope}")
        print(f"  Entities: {[(e.text, e.entity_type) for e in result.entities]}")


if __name__ == "__main__":
    test_nlu()
