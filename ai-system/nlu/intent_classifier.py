"""
Module Intent Classifier sử dụng mô hình PhoBERT fine-tuned từ HuggingFace Hub:
souta04/phobert-electronics-e-commerce-nlu

Tự động phân loại intent của người dùng (hỏi giá, thông số, so sánh, out_of_scope, v.v.)
"""
import logging
import os
from typing import Dict, Tuple

# Hướng cache Hugging Face sang ổ D
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"
os.environ["HF_HUB_DISABLE_SYMLINKS"] = "1"
if "HF_HOME" not in os.environ:
    os.environ["HF_HOME"] = "D:/huggingface_cache"


import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification

from config.constants import INTENT_LABELS


logger = logging.getLogger(__name__)

DEFAULT_MODEL_NAME = os.getenv("NLU_MODEL_NAME", "souta04/phobert-electronics-e-commerce-nlu")
CONFIDENCE_THRESHOLD = float(os.getenv("NLU_CONFIDENCE_THRESHOLD", "0.45"))


class IntentClassifier:
    def __init__(self, model_name_or_path: str = DEFAULT_MODEL_NAME):
        self.model_name_or_path = model_name_or_path
        self.tokenizer = None
        self.model = None
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self._is_loaded = False

    def load_model(self) -> None:
        """Tải tokenizer và PhoBERT sequence classification model từ Hugging Face Hub (nếu có cache)"""
        if self._is_loaded:
            return

        logger.info(f"Loading NLU Intent Classifier model from '{self.model_name_or_path}' on {self.device}...")
        try:
            self.tokenizer = AutoTokenizer.from_pretrained(self.model_name_or_path, local_files_only=True)
            self.model = AutoModelForSequenceClassification.from_pretrained(self.model_name_or_path, local_files_only=True)
            if self.model is not None:
                self.model.to(self.device)
                self.model.eval()
                self._is_loaded = True
                logger.info("NLU Intent Classifier loaded from local cache successfully.")
        except Exception as e:
            logger.warning(f"Chưa có sẵn mô hình HF '{self.model_name_or_path}' ở local cache: {e}. Sẽ dùng Rule-based Fallback Mode.")
            self._is_loaded = True
            self.model = None
            self.tokenizer = None



    def predict(self, text: str) -> Tuple[str, float, Dict[str, float]]:
        """
        Dự đoán intent cho câu truy vấn nhập vào.
        Trả về tuple: (top_intent, confidence, dict_all_intent_scores)
        """
        if not text or not text.strip():
            return "general_query", 1.0, {"general_query": 1.0}

        if not self._is_loaded:
            self.load_model()

        # Fallback thông minh dựa trên từ khóa nếu mô hình HF chưa sẵn sàng
        if self.model is None or self.tokenizer is None:
            text_lower = text.lower()
            if any(k in text_lower for k in ["giá", "bao nhiêu", "tiền", "nhiêu", "chi phí"]):
                return "price_query", 0.85, {"price_query": 0.85}
            elif any(k in text_lower for k in ["so sánh", "khác gì", "tốt hơn", "hơn"]):
                return "comparison_query", 0.85, {"comparison_query": 0.85}
            elif any(k in text_lower for k in ["thông số", "ram", "cpu", "màn hình", "cấu hình", "ssd", "gaming", "card"]):
                return "spec_query", 0.85, {"spec_query": 0.85}
            return "general_query", 0.70, {"general_query": 0.70}


        try:
            inputs = self.tokenizer(
                text,
                return_tensors="pt",
                truncation=True,
                max_length=256,
                padding=True
            ).to(self.device)

            with torch.no_grad():
                outputs = self.model(**inputs)
                probabilities = torch.softmax(outputs.logits, dim=-1)[0]

            # Lấy danh sách id2label từ config của mô hình nếu có
            id2label = getattr(self.model.config, "id2label", {})
            if not id2label:
                id2label = {i: label for i, label in enumerate(INTENT_LABELS)}

            scores: Dict[str, float] = {}
            for i, prob in enumerate(probabilities):
                label_name = id2label.get(i, f"intent_{i}")
                scores[label_name] = float(prob.item())

            top_idx = torch.argmax(probabilities).item()
            top_intent = id2label.get(top_idx, "general_query")
            top_confidence = float(probabilities[top_idx].item())

            # Nếu confidence thấp hơn ngưỡng, gán về out_of_scope
            if top_confidence < CONFIDENCE_THRESHOLD and top_intent != "out_of_scope":
                logger.info(f"Query '{text}' có confidence {top_confidence:.2f} < {CONFIDENCE_THRESHOLD}, gán thành out_of_scope")
                top_intent = "out_of_scope"

            return top_intent, top_confidence, scores

        except Exception as e:
            logger.error(f"Lỗi trong quá trình dự đoán intent: {e}")
            return "general_query", 0.0, {"general_query": 0.0}


# Singleton instance để tái sử dụng
_classifier_instance = None


def get_intent_classifier() -> IntentClassifier:
    global _classifier_instance
    if _classifier_instance is None:
        _classifier_instance = IntentClassifier()
    return _classifier_instance
