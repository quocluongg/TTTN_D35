"""
End-to-End integration test for RAG Chatbot Pipeline linked messages in ai-v3.2.
"""

import pytest
from core.pineline import RAGChatbotPipeline


def test_rag_pipeline_linked_messages_flow():
    pipeline = RAGChatbotPipeline(products=[
        {
            "id": "prod-asus-g16",
            "name": "Laptop ASUS ROG Strix G16",
            "brand": "ASUS",
            "category": "Laptop Gaming",
            "price": 42990000,
            "specs": "Intel Core i9-14900HX | 32GB RAM | RTX 4070 | 1TB SSD",
            "description": "Laptop gaming cao cấp màn hình 240Hz.",
            "rating": 4.9
        }
    ])

    # Turn 1: Initial Question
    res1 = pipeline.process_query(query="Laptop ASUS ROG Strix G16 giá bao nhiêu?")
    assert res1["conversation_id"] is not None
    assert res1["message_id"] is not None
    assert res1["user_message_id"] is not None
    assert res1["parent_id"] == res1["user_message_id"]

    conv_id = res1["conversation_id"]
    bot_msg1_id = res1["message_id"]

    # Turn 2: Follow-up question using pronoun "nó" (referring to ASUS ROG Strix G16)
    res2 = pipeline.process_query(
        query="Cấu hình của nó như thế nào?",
        conversation_id=conv_id,
        parent_id=bot_msg1_id
    )

    assert res2["conversation_id"] == conv_id
    assert res2["message_id"] is not None
    assert res2["user_message_id"] is not None
    assert res2["parent_id"] == res2["user_message_id"]
    assert res2["history_length"] >= 2

    # Check conversation history recorded in ConversationManager
    conv_data = pipeline.conv_manager.get_conversation(conv_id)
    assert conv_data is not None
    assert conv_data["total_messages"] == 4  # User1, Bot1, User2, Bot2


if __name__ == "__main__":
    test_rag_pipeline_linked_messages_flow()
    print("RAG PIPELINE LINKED MESSAGES TEST PASSED!")
