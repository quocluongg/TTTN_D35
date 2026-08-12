"""Conversation session store: per-session history with TTL expiry."""
import re
import time
from typing import Dict, List, Optional


class SessionStore:
    """In-memory session store for multi-turn conversations."""

    def __init__(self, ttl: int = 1800, max_turns: int = 6):
        self.ttl = ttl
        self.max_turns = max_turns
        self._sessions: Dict[str, List[dict]] = {}
        self._last_access: Dict[str, float] = {}

    def add_turn(self, session_id: str, role: str, content: str):
        """Add a turn to session history."""
        self._cleanup_expired()

        if session_id not in self._sessions:
            self._sessions[session_id] = []

        self._sessions[session_id].append({"role": role, "content": content})

        # Keep only last N turns
        if len(self._sessions[session_id]) > self.max_turns * 2:
            self._sessions[session_id] = self._sessions[session_id][-(self.max_turns * 2) :]

        self._last_access[session_id] = time.time()

    def get_history(self, session_id: str) -> List[dict]:
        """Return conversation history for session."""
        self._cleanup_expired()
        return self._sessions.get(session_id, [])

    def get_history_text(self, session_id: str) -> str:
        """Return formatted history text for prompt injection."""
        history = self.get_history(session_id)
        if not history:
            return ""
        lines = []
        for msg in history[-(self.max_turns * 2) :]:
            role = "Khách hàng" if msg["role"] == "user" else "Tư vấn viên"
            lines.append(f"{role}: {msg['content']}")
        return "\n".join(lines)

    def resolve_reference(self, session_id: str, query: str) -> Optional[str]:
        """Resolve 'cái đó', 'sản phẩm đó' to last mentioned product name."""
        ref_patterns = re.compile(
            r"\b(cái đó|sản phẩm đó|chiếc đó|em đó|nó|cái này|sản phẩm này)\b",
            re.IGNORECASE,
        )
        if not ref_patterns.search(query):
            return None

        history = self.get_history(session_id)
        if not history:
            return None

        # Find last assistant message with product mention
        for msg in reversed(history):
            if msg["role"] == "assistant":
                # Try to extract product name from bold markdown
                names = re.findall(r"\*\*([^*]+)\*\*", msg["content"])
                if names:
                    return names[0]
        return None

    def clear(self, session_id: str):
        """Clear a session."""
        self._sessions.pop(session_id, None)
        self._last_access.pop(session_id, None)

    def active_sessions(self) -> int:
        """Count active sessions."""
        self._cleanup_expired()
        return len(self._sessions)

    def _cleanup_expired(self):
        """Remove expired sessions."""
        now = time.time()
        expired = [
            sid for sid, last in self._last_access.items()
            if now - last > self.ttl
        ]
        for sid in expired:
            self._sessions.pop(sid, None)
            self._last_access.pop(sid, None)
