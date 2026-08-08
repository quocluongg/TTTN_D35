"""Conversations API - Customer AI chat management."""
import sys
import os
import logging
from datetime import datetime
from typing import Optional
from uuid import UUID

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from db.supabase_client import get_connection

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/chat/conversations", tags=["conversations"])


# ============ SCHEMAS ============

class ConversationCreate(BaseModel):
    title: str = "Cuộc trò chuyện mới"


class ConversationResponse(BaseModel):
    id: str
    title: str
    status: str
    started_at: str
    message_count: int = 0
    last_message: Optional[str] = None


class MessageResponse(BaseModel):
    id: str
    role: str
    content: str
    confidence: Optional[float] = None
    sources: list = []
    suggested_products: list = []
    created_at: str


class ConversationDetail(BaseModel):
    id: str
    title: str
    status: str
    started_at: str
    messages: list[MessageResponse]


class MessageCreate(BaseModel):
    content: str


# ============ ENDPOINTS ============

@router.post("", response_model=ConversationResponse)
async def create_conversation(body: ConversationCreate, user_id: str = Query(...)):
    """Create a new conversation."""
    conn = get_connection()
    cur = conn.cursor()

    try:
        # Generate title from first message or use default
        title = body.title if body.title != "Cuộc trò chuyện mới" else _generate_title(body.title)

        cur.execute("""
            INSERT INTO rag_conversations (user_id, status, started_at)
            VALUES (%s, 'ACTIVE', NOW())
            RETURNING id, status, started_at
        """, (user_id,))

        row = cur.fetchone()
        conn.commit()

        return ConversationResponse(
            id=str(row[0]),
            title=title,
            status=row[1],
            started_at=row[2].isoformat(),
            message_count=0,
        )

    except Exception as e:
        conn.rollback()
        logger.error(f"Failed to create conversation: {e}")
        raise HTTPException(500, str(e))
    finally:
        cur.close()
        conn.close()


@router.get("", response_model=list[ConversationResponse])
async def list_conversations(
    user_id: str = Query(...),
    search: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """List conversations for a user."""
    conn = get_connection()
    cur = conn.cursor()

    try:
        query = """
            SELECT
                c.id,
                c.status,
                c.started_at,
                COUNT(m.id) as message_count,
                (
                    SELECT content FROM rag_messages
                    WHERE conversation_id = c.id
                    ORDER BY created_at DESC LIMIT 1
                ) as last_message
            FROM rag_conversations c
            LEFT JOIN rag_messages m ON m.conversation_id = c.id
            WHERE c.user_id = %s
        """
        params = [user_id]

        if search:
            # Search in messages content
            query += """
                AND c.id IN (
                    SELECT conversation_id FROM rag_messages
                    WHERE content ILIKE %s
                )
            """
            params.append(f"%{search}%")

        query += """
            GROUP BY c.id
            ORDER BY c.started_at DESC
            LIMIT %s OFFSET %s
        """
        params.extend([limit, offset])

        cur.execute(query, params)
        rows = cur.fetchall()

        conversations = []
        for row in rows:
            # Generate title from first message
            title = _generate_title_from_conversation(str(row[0]))

            conversations.append(ConversationResponse(
                id=str(row[0]),
                title=title,
                status=row[1],
                started_at=row[2].isoformat(),
                message_count=row[3],
                last_message=row[4][:50] if row[4] else None,
            ))

        return conversations

    except Exception as e:
        logger.error(f"Failed to list conversations: {e}")
        raise HTTPException(500, str(e))
    finally:
        cur.close()
        conn.close()


@router.get("/{conversation_id}", response_model=ConversationDetail)
async def get_conversation(conversation_id: str):
    """Get conversation with all messages."""
    conn = get_connection()
    cur = conn.cursor()

    try:
        # Get conversation
        cur.execute("""
            SELECT id, status, started_at
            FROM rag_conversations
            WHERE id = %s
        """, (conversation_id,))

        conv = cur.fetchone()
        if not conv:
            raise HTTPException(404, "Conversation not found")

        # Get messages
        cur.execute("""
            SELECT id, role, content, confidence, sources, suggested_products, created_at
            FROM rag_messages
            WHERE conversation_id = %s
            ORDER BY created_at ASC
        """, (conversation_id,))

        messages = []
        for row in cur.fetchall():
            messages.append(MessageResponse(
                id=str(row[0]),
                role=row[1],
                content=row[2],
                confidence=float(row[3]) if row[3] else None,
                sources=row[4] if row[4] else [],
                suggested_products=row[5] if row[5] else [],
                created_at=row[6].isoformat(),
            ))

        title = _generate_title_from_conversation(conversation_id)

        return ConversationDetail(
            id=str(conv[0]),
            title=title,
            status=conv[1],
            started_at=conv[2].isoformat(),
            messages=messages,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get conversation: {e}")
        raise HTTPException(500, str(e))
    finally:
        cur.close()
        conn.close()


@router.delete("/{conversation_id}")
async def delete_conversation(conversation_id: str):
    """Delete conversation and all its messages."""
    conn = get_connection()
    cur = conn.cursor()

    try:
        # Check if exists
        cur.execute("SELECT id FROM rag_conversations WHERE id = %s", (conversation_id,))
        if not cur.fetchone():
            raise HTTPException(404, "Conversation not found")

        # Delete (cascade will delete messages)
        cur.execute("DELETE FROM rag_conversations WHERE id = %s", (conversation_id,))
        conn.commit()

        return {"status": "deleted", "id": conversation_id}

    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        logger.error(f"Failed to delete conversation: {e}")
        raise HTTPException(500, str(e))
    finally:
        cur.close()
        conn.close()


# ============ HELPERS ============

def _generate_title(text: str) -> str:
    """Generate a short title from text."""
    if len(text) > 30:
        return text[:30] + "..."
    return text


def _generate_title_from_conversation(conversation_id: str) -> str:
    """Generate title from first user message in conversation."""
    conn = get_connection()
    cur = conn.cursor()

    try:
        cur.execute("""
            SELECT content FROM rag_messages
            WHERE conversation_id = %s AND role = 'user'
            ORDER BY created_at ASC LIMIT 1
        """, (conversation_id,))

        row = cur.fetchone()
        if row:
            return _generate_title(row[0])
        return "Cuộc trò chuyện mới"

    except:
        return "Cuộc trò chuyện mới"
    finally:
        cur.close()
        conn.close()
