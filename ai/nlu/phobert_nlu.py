"""PhoBERT Transformer NLU for Vietnamese electronics intent classification.

Falls back to RuleEngine if model fails to load.
Only handles intent classification — NER always comes from rules.
"""
import logging
import os

from ai.nlu.rule_engine import RuleEngine
from ai.nlu.schema import IntentType, NLUResult

logger = logging.getLogger(__name__)

# HuggingFace model ID
HF_MODEL_ID = "souta04/phobert-electronics-e-commerce-nlu"

# Local checkpoint path
_LOCAL_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "models", "phobert_electronics_nlu")

# 10-class label mapping (greeting excluded — handled by rules)
PHOBERT_LABELS = [
    IntentType.ASK_SPECS,
    IntentType.COMPARE_PRODUCTS,
    IntentType.ASK_PRICE,
    IntentType.ASK_WARRANTY,
    IntentType.PURCHASE_CONSULTATION,
    IntentType.ASK_PROMOTION,
    IntentType.ORDER_PRODUCT,
    IntentType.COMPLAIN,
    IntentType.GENERAL_QUERY,
    IntentType.OUT_OF_SCOPE,
]


class PhoBERTNLU:
    """PhoBERT-based intent classifier with rule-based fallback."""

    def __init__(self):
        self.rule_engine = RuleEngine()
        self.model = None
        self.tokenizer = None
        self.is_loaded = False
        self._load_model()

    def _load_model(self):
        """Try to load PhoBERT from local checkpoint or HuggingFace Hub."""
        source = _LOCAL_DIR if os.path.exists(os.path.join(_LOCAL_DIR, "config.json")) else HF_MODEL_ID

        try:
            logger.info(f"[PhoBERT NLU] Loading model from: {source}")
            from transformers import AutoModelForSequenceClassification, AutoTokenizer

            self.tokenizer = AutoTokenizer.from_pretrained(source)
            self.model = AutoModelForSequenceClassification.from_pretrained(source)
            self.is_loaded = True
            logger.info(f"[PhoBERT NLU] Loaded successfully from '{source}'")
        except Exception as e:
            logger.warning(f"[PhoBERT NLU] Cannot load model ({e}). Using RuleEngine fallback.")
            self.is_loaded = False

    def parse(self, text: str) -> NLUResult:
        """Parse query: rules handle NER + greeting, PhoBERT handles other intents."""
        # Always get rule-based result first (for NER + greeting fast-path)
        rule_result = self.rule_engine.parse(text)

        # Greeting is always handled by rules
        if rule_result.intent == IntentType.GREETING:
            return rule_result

        # If PhoBERT not loaded, use rule result
        if not self.is_loaded or not self.model or not self.tokenizer:
            return rule_result

        # Try PhoBERT intent classification
        try:
            import torch

            inputs = self.tokenizer(text, return_tensors="pt", truncation=True, max_length=128)
            with torch.no_grad():
                outputs = self.model(**inputs)
                probs = torch.softmax(outputs.logits, dim=-1).squeeze().tolist()

            best_idx = probs.index(max(probs))
            predicted_intent = self._idx_to_intent(best_idx)

            return NLUResult(
                original_query=text,
                intent=predicted_intent,
                confidence=round(max(probs), 4),
                entities=rule_result.entities,  # NER always from rules
                intent_scores={predicted_intent.value: round(max(probs), 4)},
            )
        except Exception as e:
            logger.warning(f"[PhoBERT NLU] Inference failed: {e}. Falling back to rules.")
            return rule_result

    def _idx_to_intent(self, idx: int) -> IntentType:
        """Map model output index to IntentType."""
        # Try id2label from model config first
        if hasattr(self.model, "config") and hasattr(self.model.config, "id2label"):
            label = self.model.config.id2label.get(idx) or self.model.config.id2label.get(str(idx))
            if label:
                try:
                    return IntentType(label)
                except ValueError:
                    pass

        # Fallback to standard label order
        if idx < len(PHOBERT_LABELS):
            return PHOBERT_LABELS[idx]

        return IntentType.GENERAL_QUERY
