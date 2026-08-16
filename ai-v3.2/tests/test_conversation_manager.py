"""
Unit tests for ConversationManager and Linked Messages in ai-v3.2.
"""

import pytest
from core.conversation_manager import ConversationManager, get_conversation_manager


def test_create_conversation():
    cm = ConversationManager()
    conv_id = cm.create_conversation(user_id="user_123", metadata={"test": True})
    assert conv_id is not None
    assert len(conv_id) == 36  # UUID length

    conv_data = cm.get_conversation(conv_id)
    assert conv_data is not None
    assert conv_data["conversation"]["user_id"] == "user_123"
    assert conv_data["total_messages"] == 0


def test_add_messages_and_verify_parent_linking():
    cm = ConversationManager()
    conv_id = cm.create_conversation()

    # 1. First message from user (root message, parent_id = None)
    msg1 = cm.add_message(
        conversation_id=conv_id,
        role="user",
        content="Laptop Asus G16 giá bao nhiêu?",
        parent_id=None
    )
    assert msg1["id"] is not None
    assert msg1["parent_id"] is None
    assert msg1["role"] == "user"

    # 2. First response from bot (parent_id = msg1["id"])
    msg2 = cm.add_message(
        conversation_id=conv_id,
        role="assistant",
        content="Laptop Asus G16 có giá 42.990.000 VNĐ.",
        parent_id=msg1["id"]
    )
    assert msg2["id"] is not None
    assert msg2["parent_id"] == msg1["id"]
    assert msg2["role"] == "assistant"

    # 3. Second question from user (parent_id = msg2["id"])
    msg3 = cm.add_message(
        conversation_id=conv_id,
        role="user",
        content="Nó có bảo hành bao lâu?",
        parent_id=msg2["id"]
    )
    assert msg3["parent_id"] == msg2["id"]

    # 4. Second response from bot (parent_id = msg3["id"])
    msg4 = cm.add_message(
        conversation_id=conv_id,
        role="assistant",
        content="Sản phẩm có bảo hành 24 tháng chính hãng.",
        parent_id=msg3["id"]
    )
    assert msg4["parent_id"] == msg3["id"]

    # Verify message chain traversal from msg4 back to msg1
    chain = cm.get_message_chain(msg4["id"])
    assert len(chain) == 4
    assert chain[0]["id"] == msg1["id"]
    assert chain[1]["id"] == msg2["id"]
    assert chain[2]["id"] == msg3["id"]
    assert chain[3]["id"] == msg4["id"]

    # Verify conversation history format
    history = cm.get_conversation_history(conv_id, last_message_id=msg4["id"])
    assert len(history) == 4
    assert history[0]["role"] == "user"
    assert history[0]["content"] == "Laptop Asus G16 giá bao nhiêu?"
    assert history[2]["role"] == "user"
    assert history[2]["content"] == "Nó có bảo hành bao lâu?"


def test_auto_linking_when_parent_id_is_none():
    cm = ConversationManager()
    conv_id = cm.create_conversation()

    # Message 1
    m1 = cm.add_message(conv_id, "user", "Chào bạn")
    # Message 2 without explicit parent_id -> auto-linked to m1
    m2 = cm.add_message(conv_id, "assistant", "Chào bạn, tôi có thể giúp gì?")
    # Message 3 without explicit parent_id -> auto-linked to m2
    m3 = cm.add_message(conv_id, "user", "Tìm tai nghe Sony")

    assert m1["parent_id"] is None
    assert m2["parent_id"] == m1["id"]
    assert m3["parent_id"] == m2["id"]

    history = cm.get_conversation_history(conv_id)
    assert len(history) == 3


if __name__ == "__main__":
    test_create_conversation()
    test_add_messages_and_verify_parent_linking()
    test_auto_linking_when_parent_id_is_none()
    print("ALL CONVERSATION LINKED MESSAGES TESTS PASSED 100%!")
