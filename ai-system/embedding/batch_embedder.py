"""
Nhận list[Chunk] chưa có embedding, trả về list[Chunk] đã gắn embedding.
Batch toàn bộ text lại thành 1 lần gọi model - nhanh hơn nhiều so với encode từng chunk.
"""
import logging

from data_pipeline.chunking.chunk_schema import Chunk
from embedding.bge_m3_encoder import encode_texts

logger = logging.getLogger(__name__)


def embed_chunks(chunks: list[Chunk]) -> list[Chunk]:
    if not chunks:
        return chunks

    texts = [c.text for c in chunks]
    embeddings = encode_texts(texts)

    for chunk, emb in zip(chunks, embeddings):
        chunk.embedding = emb

    logger.info(f"Đã embed {len(chunks)} chunks (dim={embeddings.shape[1]})")
    return chunks
