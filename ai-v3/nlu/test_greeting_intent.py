"""
Unit test kiểm tra phân loại Intent chuyên biệt (GREETING, COMPLAIN, WARRANTY, PROMOTION...) trong ai-v3.
"""

from nlu.phobert_nlu import PhoBERTElectronicsNLU
from nlu.schema import IntentType
from core.pineline import RAGChatbotPipeline


def test_intent_classification():
    engine = PhoBERTElectronicsNLU()

    greetings = [
        "chào bạn",
        "xin chào",
        "chào em",
        "chào shop",
        "hi shop",
        "hello",
        "alo shop",
        "dạ chào shop",
    ]
    for query in greetings:
        res = engine.parse(query)
        assert res.intent == IntentType.GREETING, f"Query '{query}' expected GREETING intent, got {res.intent}"

    complaints = [
        "sao cái laptop của tui mới mua đã hư rồi",
        "máy mới mua bị hỏng rồi shop ơi",
        "máy giao bị trầy xước và lỗi nguồn",
    ]
    for query in complaints:
        res = engine.parse(query)
        assert res.intent == IntentType.COMPLAIN, f"Query '{query}' expected COMPLAIN intent, got {res.intent}"


def test_pipeline_complain_fast_path():
    pipeline = RAGChatbotPipeline(products=[])
    res = pipeline.process_query("sao cái laptop của tui mới mua đã hư rồi")

    assert res["intent"] == "complain"
    assert "xin lỗi" in res["answer"].lower()
    assert res["retrieved_products"] == []
    assert res["recommended_products"] == []
