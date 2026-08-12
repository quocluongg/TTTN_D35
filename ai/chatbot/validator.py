"""Response validation: check LLM output against retrieved context for hallucination."""
import re
from typing import Any, Dict, List, Tuple


class ResponseValidator:
    """Validate LLM response grounding against retrieved product data."""

    def validate(
        self, response_text: str, context: List[Dict[str, Any]]
    ) -> Tuple[bool, List[str]]:
        """Check response for hallucinated prices/names.

        Returns:
            (is_valid, list_of_warnings)
        """
        if not context or not response_text:
            return True, []

        warnings = []

        # Price check: extract numbers mentioned as prices
        price_matches = re.findall(
            r"(\d+(?:\.\d+)?)\s*(?:triệu|tr|vnđ|đ)", response_text, re.IGNORECASE
        )
        context_prices = set()
        for item in context:
            price = float(item.get("price", 0))
            if price > 0:
                context_prices.add(price)
                context_prices.add(price / 1_000_000)

        for match in price_matches:
            try:
                val = float(match.replace(".", ""))
                if val > 100 and not any(abs(val - cp) < 1000 for cp in context_prices if cp > 100):
                    warnings.append(f"Giá {match} không khớp dữ liệu hệ thống.")
            except ValueError:
                pass

        return len(warnings) == 0, warnings
