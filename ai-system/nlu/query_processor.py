"""
Query Processor Orchestrator: Tích hợp Out-of-Scope Detector, Intent Classifier và NER Extractor.
"""
import logging
from nlu.schema import NLUResult
from nlu.intent_classifier import get_intent_classifier
from nlu.out_of_scope_detector import check_out_of_scope
from nlu.ner_extractor import get_ner_extractor

logger = logging.getLogger(__name__)


def process_query(query: str) -> NLUResult:
    """
    Xử lý truy vấn của người dùng qua 3 bước NLU:
    1. Check Out of Scope
    2. Intent Classification
    3. NER Entity Extraction
    """
    if not query or not query.strip():
        return NLUResult(
            original_query=query or "",
            intent="general_query",
            confidence=1.0,
            entities=[],
            intent_scores={"general_query": 1.0},
            is_out_of_scope=False,
        )

    # 1. Out of Scope Check & Intent Classification
    is_oos, intent, confidence = check_out_of_scope(query)
    classifier = get_intent_classifier()
    _, _, intent_scores = classifier.predict(query)

    # 2. NER Extraction
    ner_extractor = get_ner_extractor()
    entities = ner_extractor.extract(query)

    result = NLUResult(
        original_query=query,
        intent=intent,
        confidence=confidence,
        entities=entities,
        intent_scores=intent_scores,
        is_out_of_scope=is_oos or (intent == "out_of_scope"),
    )

    logger.info(f"Processed NLU query='{query}' -> intent='{result.intent}', is_oos={result.is_out_of_scope}, entities={len(result.entities)}")
    return result
