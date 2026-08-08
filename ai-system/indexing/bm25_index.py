"""
BM25 sparse index dùng rank_bm25.
Lưu ý: rank_bm25 không hỗ trợ incremental update thật sự - mỗi lần add/delete
đều cần rebuild lại BM25Okapi object từ toàn bộ corpus đang có trong memory.
Với quy mô vài nghìn - vài chục nghìn sản phẩm, rebuild mất ~vài trăm ms, chấp
nhận được cho luồng admin insert (không phải real-time chat).

Nếu sau này cần update tần suất cao / dữ liệu lớn hơn, nên chuyển sang
Elasticsearch/OpenSearch (có BM25 built-in, hỗ trợ update tốt hơn nhiều).
"""
import logging
import os
import pickle
import threading

from rank_bm25 import BM25Okapi

from config.settings import get_settings
from data_pipeline.chunking.chunk_schema import Chunk

logger = logging.getLogger(__name__)
settings = get_settings()

_INDEX_FILE = os.path.join(settings.BM25_INDEX_DIR, "bm25_corpus.pkl")
_lock = threading.Lock()

# corpus lưu trong memory: {doc_id: {"text": ..., "metadata": ..., "tokens": [...]}}
_corpus: dict[str, dict] = {}
_bm25: BM25Okapi | None = None


def _tokenize(text: str) -> list[str]:
    """Tokenize đơn giản theo khoảng trắng + lowercase. Có thể thay bằng underthesea/pyvi sau."""
    return text.lower().split()


def _load_corpus() -> None:
    global _corpus
    os.makedirs(settings.BM25_INDEX_DIR, exist_ok=True)
    if os.path.exists(_INDEX_FILE):
        with open(_INDEX_FILE, "rb") as f:
            _corpus = pickle.load(f)
    else:
        _corpus = {}


def _persist_corpus() -> None:
    os.makedirs(settings.BM25_INDEX_DIR, exist_ok=True)
    with open(_INDEX_FILE, "wb") as f:
        pickle.dump(_corpus, f)


def _rebuild_bm25() -> None:
    global _bm25
    if not _corpus:
        _bm25 = None
        return
    tokenized_docs = [doc["tokens"] for doc in _corpus.values()]
    _bm25 = BM25Okapi(tokenized_docs)


def _ensure_loaded() -> None:
    if not _corpus and not os.path.exists(_INDEX_FILE):
        return
    if _bm25 is None:
        with _lock:
            _load_corpus()
            _rebuild_bm25()


def add_documents(chunks: list[Chunk]) -> None:
    """
    IPO Model:
    - Input: chunks (Danh sách các đối tượng Chunk cần tạo chỉ mộc từ vựng)
    - Process:
        Step 1: Kiểm tra danh sách rỗng -> return
        Step 2: Nạp corpus hiện tại từ file pickle dưới ổ đĩa
        Step 3: Lặp qua các chunk, phân tách từ ngữ (tokenize) và cập nhật _corpus dict
        Step 4: Ghi lưu bền vững _corpus ra file pickle
        Step 5: Tái khởi tạo BM25Okapi index đối tượng từ corpus mới
    - Output: None
    """
    # Step 1: Kiểm tra danh sách chunks rỗng
    if not chunks:
        return

    with _lock:
        # Step 2: Nạp corpus đã lưu từ đĩa
        _load_corpus()

        # Step 3: Thêm các văn bản chunk mới vào corpus dict
        for chunk in chunks:
            _corpus[chunk.id] = {
                "text": chunk.text,
                "metadata": chunk.metadata_dict(),
                "tokens": _tokenize(chunk.text),
            }

        # Step 4: Lưu đĩa và rebuild BM25Okapi
        _persist_corpus()
        _rebuild_bm25()

    # Step 5: Ghi vết log
    logger.info(f"Đã thêm {len(chunks)} chunks vào BM25 index")


def delete_by_product_id(product_id: str) -> None:
    """
    IPO Model:
    - Input: product_id (Mã sản phẩm dạng chuỗi)
    - Process:
        Step 1: Nạp corpus từ ổ đĩa
        Step 2: Tìm tất cả doc_id có metadata["product_id"] khớp với tham số
        Step 3: Xóa các doc_id tương ứng khỏi _corpus dict
        Step 4: Ghi đè file lưu vết và tái khởi tạo BM25Okapi
    - Output: None
    """
    with _lock:
        # Step 1: Nạp dữ liệu corpus
        _load_corpus()

        # Step 2: Tìm danh sách doc_id của sản phẩm cần xóa
        ids_to_remove = [
            doc_id for doc_id, doc in _corpus.items()
            if doc["metadata"].get("product_id") == product_id
        ]

        # Step 3: Xóa khỏi bộ nhớ
        for doc_id in ids_to_remove:
            del _corpus[doc_id]

        # Step 4: Lưu file và rebuild chỉ mục BM25
        _persist_corpus()
        _rebuild_bm25()

    # Step 5: Ghi log hoàn tất
    logger.info(f"Đã xóa {len(ids_to_remove)} chunks của product_id={product_id} khỏi BM25 index")


def search(query: str, top_k: int = 20, filters: dict | None = None) -> list[dict]:
    """
    IPO Model:
    - Input:
        - query: Câu truy vấn dạng chuỗi (ví dụ: 'laptop gaming asus')
        - top_k: Số lượng kết quả tối đa trả về (mặc định 20)
        - filters: Bộ lọc metadata tùy chọn (ví dụ: {"brand": "Asus"})
    - Process:
        Step 1: Đảm bảo BM25 Index đã được nạp vào bộ nhớ
        Step 2: Tokenize chuỗi query và gọi _bm25.get_scores để lấy điểm số từ vựng BM25
        Step 3: Sắp xếp danh sách tài liệu theo điểm BM25 giảm dần
        Step 4: Lọc kết quả theo điều kiện metadata filters nếu có
    - Output: List[dict] danh sách tài liệu thỏa mãn điều kiện khớp BM25 tốt nhất
    """
    # Step 1: Kiểm tra nạp dữ liệu BM25
    _ensure_loaded()
    if _bm25 is None:
        return []

    # Step 2: Lấy danh sách ID và tính điểm số BM25
    doc_ids = list(_corpus.keys())
    scores = _bm25.get_scores(_tokenize(query))

    # Step 3: Sắp xếp tài liệu theo điểm số giảm dần
    ranked = sorted(zip(doc_ids, scores), key=lambda x: -x[1])

    # Step 4: Duyệt và áp dụng bộ lọc metadata
    hits = []
    for doc_id, score in ranked:
        doc = _corpus[doc_id]
        if filters and not all(doc["metadata"].get(k) == v for k, v in filters.items()):
            continue
        hits.append({"id": doc_id, "text": doc["text"], "metadata": doc["metadata"], "score": score})
        if len(hits) >= top_k:
            break

    # Step 5: Trả về kết quả hits
    return hits

