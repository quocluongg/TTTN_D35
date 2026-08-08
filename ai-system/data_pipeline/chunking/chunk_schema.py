"""
Cấu trúc Chunk dữ liệu phục vụ Vector Store và BM25 Index.
"""
from dataclasses import dataclass, field
from typing import Any, Dict
import numpy as np


@dataclass
class Chunk:
    id: str
    text: str
    product_id: str
    chunk_type: str  # spec, description, faq, policy
    metadata: Dict[str, Any] = field(default_factory=dict)
    embedding: np.ndarray | None = None

    def metadata_dict(self) -> Dict[str, Any]:
        """Trả về dictionary chứa thông tin metadata gắn với chunk."""
        meta = {
            "product_id": self.product_id,
            "chunk_type": self.chunk_type,
        }
        meta.update(self.metadata)
        return meta
