"""Engine facade: single initialization point, thread-safe, clean API.

Orchestrates NLU, retrieval, LLM, validation, session, and off-topic gate.
"""
import logging
import re
import threading
from typing import Any, Dict, Generator, List, Optional

from ai.chatbot.llm_client import LLMClient
from ai.chatbot.session import SessionStore
from ai.chatbot.validator import ResponseValidator
from ai.config import Settings, get_settings
from ai.core.db import fetch_all_products
from ai.core.off_topic import OffTopicGate
from ai.core.recommender import ProductRecommender
from ai.core.retriever import Stage01Retriever
from ai.nlu.phobert_nlu import PhoBERTNLU
from ai.nlu.query_understanding import build_query_vocab, intent_note, understand_query
from ai.nlu.rule_engine import RuleEngine
from ai.nlu.schema import IntentType, NLUResult

logger = logging.getLogger(__name__)

# Multi-intent clause separator
_CLAUSE_SEP = re.compile(r"[?;,]|\s+(?:và|va)\s+", re.IGNORECASE)


class Engine:
    """Single facade for all AI components. Thread-safe initialization."""

    def __init__(self, settings: Settings = None):
        self.settings = settings or get_settings()
        self._lock = threading.Lock()
        self._ready = False

        # Components — initialized in _warmup()
        self.rule_engine: Optional[RuleEngine] = None
        self.phobert: Optional[PhoBERTNLU] = None
        self.retriever: Optional[Stage01Retriever] = None
        self.recommender: Optional[ProductRecommender] = None
        self.llm: Optional[LLMClient] = None
        self.off_topic: Optional[OffTopicGate] = None
        self.session_store: Optional[SessionStore] = None
        self.validator: Optional[ResponseValidator] = None
        self.vocab: frozenset = frozenset()
        self.products: list = []

    def _warmup(self):
        """Initialize all components. Called once at startup."""
        with self._lock:
            try:
                logger.info("[Engine] Warming up...")
                self.products = fetch_all_products()

                self.rule_engine = RuleEngine()
                self.phobert = PhoBERTNLU()
                self.retriever = Stage01Retriever(self.products, settings=self.settings)
                self.recommender = ProductRecommender(self.products)
                self.llm = LLMClient(self.settings)
                self.off_topic = OffTopicGate(self.retriever.embeddings, threshold=self.settings.OFF_TOPIC_THRESHOLD)
                self.session_store = SessionStore(ttl=self.settings.SESSION_TTL, max_turns=self.settings.SESSION_MAX_TURNS)
                self.validator = ResponseValidator()
                self.vocab = build_query_vocab()

                self._ready = True
                logger.info(f"[Engine] Ready! {len(self.products)} products loaded.")
            except Exception as e:
                logger.error(f"[Engine] Warmup failed: {e}")

    @property
    def is_ready(self) -> bool:
        return self._ready

    def parse_nlu(self, query: str) -> Dict[str, Any]:
        """NLU analysis only."""
        self._ensure_ready()
        nlu = self._run_nlu(query)
        return {
            "original_query": nlu.original_query,
            "intent": nlu.intent.value,
            "confidence": nlu.confidence,
            "entities": [e.model_dump() for e in nlu.entities],
        }

    def search(self, query: str, top_k: int = 5) -> Dict[str, Any]:
        """Product search only (no LLM)."""
        self._ensure_ready()
        understanding = understand_query(query, self.vocab)
        search_text = understanding["corrected"]

        nlu = self._run_nlu(query)
        max_price = self._extract_max_price(nlu.entities)

        results = self.retriever.retrieve_and_rank(
            query=search_text, max_price=max_price, top_k=top_k
        )
        return {"query": query, "total": len(results), "products": results}

    def chat(self, query: str, session_id: str = None) -> Dict[str, Any]:
        """Full RAG pipeline: NLU -> retrieval -> LLM -> validation -> response."""
        self._ensure_ready()

        # Step 1: Query understanding
        understanding = understand_query(query, self.vocab)
        search_text = understanding["corrected"]
        display_query = understanding["display"]

        # Greeting fast-path
        if self._is_greeting(query):
            answer = self.llm._fallback(query, "greeting", [])
            return self._make_response(query, answer, "greeting", 0.99, [], [], [], [], session_id)

        # Step 2: Off-topic gate
        is_off, sim = self.off_topic.is_off_topic(search_text)
        if is_off:
            answer = self.llm._fallback(query, "out_of_scope", [])
            return self._make_response(query, answer, "out_of_scope", 0.95, [], [], [], [], session_id)

        # Step 3: Multi-intent split
        multi = self._split_intents(query)

        # Step 4: NLU
        nlu = self._run_nlu(query if not multi else display_query)
        intent = nlu.intent.value
        confidence = nlu.confidence
        entities = [{"text": e.text, "entity_type": e.entity_type.value, "confidence": e.confidence} for e in nlu.entities]

        # Step 5: Session / history
        history_text = ""
        if session_id:
            ref = self.session_store.resolve_reference(session_id, display_query)
            if ref:
                display_query = f"{ref} {display_query}"
                search_text = f"{ref} {search_text}"
            history_text = self.session_store.get_history_text(session_id)

        # Step 6: Retrieval
        max_price = self._extract_max_price(nlu.entities)
        products = self.retriever.retrieve_and_rank(
            query=search_text, max_price=max_price, top_k=self.settings.RERANK_TOP_K
        )

        # Recommendations
        recommendations = []
        if products:
            seed_id = str(products[0].get("id", ""))
            recommendations = self.recommender.recommend_similar(seed_id, top_k=4)

        # Step 7: Multi-intent handling
        if multi and len(multi) >= 2:
            parts = []
            for clause in multi:
                clause_nlu = self._run_nlu(clause)
                clause_products = self.retriever.retrieve_and_rank(query=clause, top_k=3)
                part = self.llm._fallback(clause, clause_nlu.intent.value, clause_products)
                parts.append(part)
            answer = "\n\n---\n\n".join(parts)
            intent = "multi"
        else:
            # Step 7: LLM generation
            correction_note = intent_note(understanding)
            answer = self.llm.generate(display_query, intent, entities, products, history_text)
            if correction_note:
                answer = correction_note + answer

        # Step 8: Validation
        is_valid, warnings = self.validator.validate(answer, products)

        # Save to session
        if session_id:
            self.session_store.add_turn(session_id, "user", query)
            self.session_store.add_turn(session_id, "assistant", answer)

        return self._make_response(
            query, answer, intent, confidence, entities,
            products, recommendations, warnings, session_id,
        )

    def chat_stream(self, query: str, session_id: str = None) -> Generator[str, None, None]:
        """Streaming chat — yields SSE data lines."""
        import json

        self._ensure_ready()

        # Steps 1-6 (sync, fast)
        understanding = understand_query(query, self.vocab)
        search_text = understanding["corrected"]
        display_query = understanding["display"]

        if self._is_greeting(query):
            answer = self.llm._fallback(query, "greeting", [])
            yield f"data: {json.dumps({'type': 'text', 'content': answer})}\n\n"
            yield f"data: {json.dumps({'type': 'meta', 'intent': 'greeting', 'products': [], 'recommendations': []})}\n\n"
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
            return

        is_off, _ = self.off_topic.is_off_topic(search_text)
        if is_off:
            answer = self.llm._fallback(query, "out_of_scope", [])
            yield f"data: {json.dumps({'type': 'text', 'content': answer})}\n\n"
            yield f"data: {json.dumps({'type': 'meta', 'intent': 'out_of_scope', 'products': [], 'recommendations': []})}\n\n"
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
            return

        nlu = self._run_nlu(query)
        intent = nlu.intent.value
        entities = [{"text": e.text, "entity_type": e.entity_type.value} for e in nlu.entities]

        history_text = ""
        if session_id:
            ref = self.session_store.resolve_reference(session_id, display_query)
            if ref:
                display_query = f"{ref} {display_query}"
                search_text = f"{ref} {search_text}"
            history_text = self.session_store.get_history_text(session_id)

        max_price = self._extract_max_price(nlu.entities)
        products = self.retriever.retrieve_and_rank(
            query=search_text, max_price=max_price, top_k=self.settings.RERANK_TOP_K
        )

        recommendations = []
        if products:
            recommendations = self.recommender.recommend_similar(str(products[0].get("id", "")), top_k=4)

        correction_note = intent_note(understanding)
        if correction_note:
            yield f"data: {json.dumps({'type': 'text', 'content': correction_note})}\n\n"

        # Step 7: Stream LLM
        produced = 0
        for chunk in self.llm.generate_stream(display_query, intent, entities, products, history_text):
            if chunk:
                produced += len(chunk)
                yield f"data: {json.dumps({'type': 'text', 'content': chunk})}\n\n"

        # Fallback if LLM produced nothing
        if produced == 0:
            answer = self.llm._fallback(display_query, intent, products)
            yield f"data: {json.dumps({'type': 'text', 'content': answer})}\n\n"

        # Validation
        _, warnings = self.validator.validate("", products)

        # Save to session
        if session_id:
            self.session_store.add_turn(session_id, "user", query)
            # We don't have the full answer here, but we saved the query

        # Meta event
        meta = {
            "type": "meta",
            "intent": intent,
            "products": [{"name": p.get("name", ""), "price": p.get("price", 0)} for p in products[:5]],
            "recommendations": [{"name": r.get("name", ""), "price": r.get("price", 0)} for r in recommendations[:5]],
            "warnings": warnings,
        }
        yield f"data: {json.dumps(meta)}\n\n"
        yield f"data: {json.dumps({'type': 'done'})}\n\n"

    # --- Internal helpers ---

    def _ensure_ready(self):
        if not self._ready:
            raise RuntimeError("Engine not ready. Wait for warmup to complete.")

    def _run_nlu(self, query: str) -> NLUResult:
        """Run NLU: rules first, PhoBERT fallback if confidence < threshold."""
        rule_result = self.rule_engine.parse(query)
        if rule_result.confidence >= self.settings.NLU_CONFIDENCE_THRESHOLD:
            return rule_result
        return self.phobert.parse(query)

    def _extract_max_price(self, entities) -> Optional[float]:
        """Extract max price from NER entities."""
        import re as _re

        for e in entities:
            e_type = e.entity_type.value if hasattr(e.entity_type, "value") else str(e.entity_type)
            if e_type == "PRICE":
                digits = "".join(c for c in e.text if c.isdigit())
                if digits:
                    val = float(digits)
                    if val < 1000:
                        val *= 1_000_000
                    return val
        return None

    def _is_greeting(self, text: str) -> bool:
        """Check if text is a greeting."""
        from ai.nlu.rule_engine import GREETING_PATTERN, strip_vietnamese_accents

        q = strip_vietnamese_accents(text.lower())
        return bool(GREETING_PATTERN.search(q.strip()))

    def _split_intents(self, query: str) -> List[str]:
        """Split compound queries into clauses."""
        clauses = [c.strip(" ,.") for c in _CLAUSE_SEP.split(query) if c and c.strip(" ,.")]
        return clauses if len(clauses) >= 2 else []

    def _make_response(
        self, query, answer, intent, confidence, entities,
        products, recommendations, warnings, session_id,
    ) -> Dict[str, Any]:
        """Build standard response dict."""
        return {
            "query": query,
            "answer": answer,
            "intent": intent,
            "confidence": confidence,
            "entities": entities,
            "retrieved_products": products,
            "recommended_products": recommendations,
            "validation": {"is_valid": len(warnings) == 0, "warnings": warnings},
            "session_id": session_id,
        }
