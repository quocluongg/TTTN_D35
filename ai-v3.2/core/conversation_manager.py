"""
Conversation & Linked Messages Manager for SHOPWISE AI Engine v3.2.
Quản lý các cuộc trò chuyện và liên kết tin nhắn theo cấu trúc danh sách liên kết (parent_id pointers).
"""

import uuid
import time
import json
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime, timezone

from core.db import get_db_connection

logger = logging.getLogger(__name__)


class ConversationManager:
    """
    Quản lý các conversation và liên kết các tin nhắn theo parent_id.
    Hỗ trợ In-memory store và tự động đồng bộ DB PostgreSQL/Supabase (bảng rag_conversations & rag_messages).
    """

    def __init__(self):
        # In-memory storage fallback
        self._conversations: Dict[str, Dict[str, Any]] = {}
        self._messages: Dict[str, Dict[str, Any]] = {}  # key: message_id
        self._conversation_message_order: Dict[str, List[str]] = {}  # key: conversation_id -> list of message_ids

    def create_conversation(self, user_id: Optional[str] = None, title: Optional[str] = None, metadata: Optional[Dict[str, Any]] = None) -> str:
        """Tạo một cuộc trò chuyện mới và trả về conversation_id."""
        conv_id = str(uuid.uuid4())
        now_iso = datetime.now(timezone.utc).isoformat()
        conv_title = title or "Cuộc trò chuyện mới"

        conv_data = {
            "id": conv_id,
            "user_id": user_id,
            "title": conv_title,
            "status": "ACTIVE",
            "started_at": now_iso,
            "metadata": metadata or {},
            "last_message_id": None
        }

        self._conversations[conv_id] = conv_data
        self._conversation_message_order[conv_id] = []

        # Thử lưu DB nếu có kết nối
        try:
            conn = get_db_connection()
            cur = conn.cursor()
            meta_json = json.dumps({**(metadata or {}), "title": conv_title})
            cur.execute(
                """
                INSERT INTO rag_conversations (id, user_id, status, started_at, metadata)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (conv_id, user_id, "ACTIVE", datetime.now(), meta_json)
            )
            conn.commit()
            cur.close()
            conn.close()
        except Exception as e:
            logger.debug(f"[ConversationManager DB Notice] Failed to persist new conversation to DB: {e}")

        return conv_id

    def list_conversations(self, user_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Lấy danh sách các conversation thuộc về user_id (hoặc tất cả nếu user_id=None)."""
        result = []
        for conv_id, conv in self._conversations.items():
            if user_id and conv.get("user_id") and conv.get("user_id") != user_id:
                continue

            msg_ids = self._conversation_message_order.get(conv_id, [])
            last_msg_text = ""
            if msg_ids and msg_ids[-1] in self._messages:
                last_msg_text = self._messages[msg_ids[-1]].get("content", "")

            result.append({
                "id": conv_id,
                "title": conv.get("title", "Cuộc trò chuyện mới"),
                "status": conv.get("status", "ACTIVE"),
                "started_at": conv.get("started_at", ""),
                "message_count": len(msg_ids),
                "last_message": last_msg_text
            })

        # Sắp xếp mới nhất lên đầu
        result.reverse()
        return result

    def delete_conversation(self, conversation_id: str) -> bool:
        """Xóa cuộc trò chuyện khỏi memory và DB."""
        if conversation_id in self._conversations:
            del self._conversations[conversation_id]
        if conversation_id in self._conversation_message_order:
            msg_ids = self._conversation_message_order.pop(conversation_id, [])
            for mid in msg_ids:
                self._messages.pop(mid, None)

        try:
            conn = get_db_connection()
            cur = conn.cursor()
            cur.execute("DELETE FROM rag_messages WHERE conversation_id = %s", (conversation_id,))
            cur.execute("DELETE FROM rag_conversations WHERE id = %s", (conversation_id,))
            conn.commit()
            cur.close()
            conn.close()
        except Exception as e:
            logger.debug(f"[ConversationManager DB Delete Error] {e}")

        return True

    def add_message(
        self,
        conversation_id: str,
        role: str,
        content: str,
        parent_id: Optional[str] = None,
        confidence: Optional[float] = None,
        sources: Optional[List[Any]] = None,
        suggested_products: Optional[List[Any]] = None,
        provider: str = "gemini"
    ) -> Dict[str, Any]:
        """
        Thêm một tin nhắn mới vào cuộc trò chuyện.
        Nếu parent_id không truyền vào, tự động liên kết tới tin nhắn gần nhất của conversation đó.
        """
        if conversation_id not in self._conversations:
            # Tạo conversation mới nếu chưa tồn tại
            self.create_conversation(title=content[:30] if content else "Cuộc trò chuyện mới", metadata={"auto_created": True})
            if conversation_id not in self._conversations:
                self._conversations[conversation_id] = {
                    "id": conversation_id,
                    "user_id": None,
                    "title": content[:30] if content else "Cuộc trò chuyện mới",
                    "status": "ACTIVE",
                    "started_at": datetime.now(timezone.utc).isoformat(),
                    "metadata": {},
                    "last_message_id": None
                }
                self._conversation_message_order[conversation_id] = []

        conv = self._conversations[conversation_id]

        # Tự động cập nhật tiêu đề conversation nếu tiêu đề mặc định và tin nhắn đầu là của user
        if conv.get("title") == "Cuộc trò chuyện mới" and role == "user":
            conv["title"] = content[:30] + ("..." if len(content) > 30 else "")

        # Tự động xác định parent_id nếu không được truyền
        if parent_id is None:
            parent_id = conv.get("last_message_id")

        msg_id = str(uuid.uuid4())
        created_at_iso = datetime.now(timezone.utc).isoformat()

        msg_obj = {
            "id": msg_id,
            "conversation_id": conversation_id,
            "parent_id": parent_id,
            "role": role,
            "content": content,
            "confidence": confidence,
            "sources": sources or [],
            "suggested_products": suggested_products or [],
            "provider": provider,
            "created_at": created_at_iso
        }

        # Lưu vào memory
        self._messages[msg_id] = msg_obj
        if conversation_id not in self._conversation_message_order:
            self._conversation_message_order[conversation_id] = []
        self._conversation_message_order[conversation_id].append(msg_id)

        # Cập nhật pointer tin nhắn cuối của conversation
        conv["last_message_id"] = msg_id

        # Thử đồng bộ DB
        try:
            conn = get_db_connection()
            cur = conn.cursor()
            cur.execute(
                """
                INSERT INTO rag_messages (id, conversation_id, role, content, confidence, sources, suggested_products, provider)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    msg_id,
                    conversation_id,
                    role,
                    content,
                    confidence,
                    json.dumps(sources or []),
                    json.dumps(suggested_products or []),
                    provider
                )
            )
            conn.commit()
            cur.close()
            conn.close()
        except Exception as e:
            logger.debug(f"[ConversationManager DB Notice] Failed to persist message {msg_id} to DB: {e}")

        return msg_obj

    def get_message_chain(self, message_id: str, max_depth: int = 10) -> List[Dict[str, Any]]:
        """
        Truy vết ngược theo các con trỏ parent_id từ message_id chỉ định về tin nhắn đầu tiên.
        Trả về danh sách tin nhắn theo thứ tự thời gian tăng dần [msg_oldest -> ... -> message_id].
        """
        chain = []
        curr_id: Optional[str] = message_id

        depth = 0
        visited = set()

        while curr_id and depth < max_depth and curr_id not in visited:
            visited.add(curr_id)
            msg = self._messages.get(curr_id)

            if not msg:
                msg = self._fetch_message_from_db(curr_id)
                if msg:
                    self._messages[curr_id] = msg

            if not msg:
                break

            chain.append(msg)
            curr_id = msg.get("parent_id")
            depth += 1

        chain.reverse()
        return chain

    def get_conversation_history(
        self,
        conversation_id: str,
        last_message_id: Optional[str] = None,
        max_turns: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Lấy danh sách các lượt hội thoại đã liên kết dưới dạng danh sách dict [{"role": ..., "content": ...}].
        """
        target_msg_id = last_message_id
        if not target_msg_id and conversation_id in self._conversations:
            target_msg_id = self._conversations[conversation_id].get("last_message_id")

        if not target_msg_id:
            return []

        chain = self.get_message_chain(target_msg_id, max_depth=max_turns * 2)
        history = [
            {
                "role": m.get("role"),
                "content": m.get("content"),
                "id": m.get("id"),
                "parent_id": m.get("parent_id")
            }
            for m in chain
        ]
        return history

    def get_conversation(self, conversation_id: str) -> Optional[Dict[str, Any]]:
        """Lấy thông tin chi tiết cuộc trò chuyện kèm danh sách các tin nhắn đã liên kết."""
        conv = self._conversations.get(conversation_id)
        if not conv:
            conv = self._fetch_conversation_from_db(conversation_id)
            if not conv:
                return None
            self._conversations[conversation_id] = conv

        msg_ids = self._conversation_message_order.get(conversation_id, [])
        messages = [self._messages[mid] for mid in msg_ids if mid in self._messages]

        return {
            "id": conv["id"],
            "title": conv.get("title", "Cuộc trò chuyện"),
            "status": conv.get("status", "ACTIVE"),
            "started_at": conv.get("started_at", ""),
            "conversation": conv,
            "total_messages": len(messages),
            "messages": messages
        }

    def _fetch_message_from_db(self, message_id: str) -> Optional[Dict[str, Any]]:
        """Fetch tin nhắn từ database PostgreSQL/Supabase."""
        try:
            conn = get_db_connection()
            cur = conn.cursor()
            cur.execute(
                """
                SELECT id, conversation_id, role, content, confidence, sources, suggested_products, provider, created_at
                FROM rag_messages
                WHERE id = %s
                """,
                (message_id,)
            )
            row = cur.fetchone()
            cur.close()
            conn.close()

            if row:
                return {
                    "id": str(row[0]),
                    "conversation_id": str(row[1]),
                    "parent_id": None,
                    "role": row[2],
                    "content": row[3],
                    "confidence": float(row[4]) if row[4] else None,
                    "sources": json.loads(row[5]) if isinstance(row[5], str) else row[5],
                    "suggested_products": json.loads(row[6]) if isinstance(row[6], str) else row[6],
                    "provider": row[7],
                    "created_at": str(row[8])
                }
        except Exception as e:
            logger.debug(f"[ConversationManager DB Fetch Error] {e}")
        return None

    def _fetch_conversation_from_db(self, conversation_id: str) -> Optional[Dict[str, Any]]:
        """Fetch conversation từ database PostgreSQL/Supabase."""
        try:
            conn = get_db_connection()
            cur = conn.cursor()
            cur.execute(
                """
                SELECT id, user_id, status, started_at, ended_at, metadata
                FROM rag_conversations
                WHERE id = %s
                """,
                (conversation_id,)
            )
            row = cur.fetchone()
            cur.close()
            conn.close()

            if row:
                meta = json.loads(row[5]) if isinstance(row[5], str) else (row[5] or {})
                return {
                    "id": str(row[0]),
                    "user_id": str(row[1]) if row[1] else None,
                    "title": meta.get("title", "Cuộc trò chuyện"),
                    "status": row[2],
                    "started_at": str(row[3]),
                    "ended_at": str(row[4]) if row[4] else None,
                    "metadata": meta,
                    "last_message_id": None
                }
        except Exception as e:
            logger.debug(f"[ConversationManager DB Fetch Error] {e}")
        return None


# Singleton instance
_conversation_manager_instance: Optional[ConversationManager] = None


def get_conversation_manager() -> ConversationManager:
    global _conversation_manager_instance
    if _conversation_manager_instance is None:
        _conversation_manager_instance = ConversationManager()
    return _conversation_manager_instance
