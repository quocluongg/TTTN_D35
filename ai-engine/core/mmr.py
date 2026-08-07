import numpy as np
from typing import List, Dict, Optional

class Stage3MMRDiversifier:
    """
    Stage 3: Re-ordering & Diversity Optimization
    Sử dụng thuật toán Maximal Marginal Relevance (MMR) để cân bằng giữa
    Độ tương quan/phù hợp (Relevance) và Độ đa dạng mẫu mã/chủng loại (Diversity).
    
    Công thức MMR:
    MMR(i) = lambda * Score_norm(i) - (1 - lambda) * max_{j in Selected} Sim(Embedding_i, Embedding_j)
    """
    def __init__(self, default_lambda: float = 0.7):
        self.default_lambda = default_lambda

    def rerank(
        self, 
        candidates: List[Dict], 
        embeddings: np.ndarray, 
        top_k: int = 10, 
        lambda_param: Optional[float] = None
    ) -> List[Dict]:
        """
        Đa dạng hóa danh sách ứng viên dựa trên vector embeddings sản phẩm.
        
        :param candidates: Danh sách ứng viên từ Stage 1 hoặc Stage 2 (chứa key '_index' và 'final_score'/'stage1_score')
        :param embeddings: Mảng numpy float32 n_products x dimension từ VectorSearcher
        :param top_k: Số sản phẩm đa dạng hóa trả về
        :param lambda_param: Tham số cân bằng (0.0: đa dạng tuyệt đối, 1.0: phù hợp tuyệt đối)
        :return: Danh sách sản phẩm top_k đã được đa dạng hóa MMR
        """
        if not candidates or len(candidates) <= 1:
            return candidates[:top_k]

        lam = lambda_param if lambda_param is not None else self.default_lambda

        # 1. Trích xuất điểm relevance (ưu tiên final_score từ Stage 2, fallback stage1_score)
        raw_scores = []
        for c in candidates:
            score = c.get('final_score', c.get('stage1_score', 0.0))
            raw_scores.append(float(score))

        raw_scores = np.array(raw_scores, dtype=np.float32)

        # Min-Max Normalization cho điểm relevance về [0, 1]
        min_s, max_s = raw_scores.min(), raw_scores.max()
        if max_s > min_s:
            norm_scores = (raw_scores - min_s) / (max_s - min_s)
        else:
            norm_scores = np.ones_like(raw_scores)

        # 2. Lấy danh sách vector embeddings tương ứng cho từng ứng viên trong candidates pool
        cand_indices = [c['_index'] for c in candidates]
        if embeddings is not None and len(embeddings) > 0:
            safe_indices = [min(max(idx, 0), len(embeddings) - 1) for idx in cand_indices]
            cand_embeddings = embeddings[safe_indices]
        else:
            # Fallback nếu không có embeddings matrix: khởi tạo ma trận đơn vị
            cand_embeddings = np.eye(len(candidates), dtype=np.float32)

        # Normalize vector embeddings để tính Cosine Similarity bằng Dot Product
        norms = np.linalg.norm(cand_embeddings, axis=1, keepdims=True)
        norms[norms == 0] = 1e-10
        normalized_cand_embeddings = cand_embeddings / norms

        # Ma trận tương đồng Cosine Similarity giữa các ứng viên trong pool
        # sim_matrix[i, j] = CosineSim(cand_i, cand_j)
        sim_matrix = np.dot(normalized_cand_embeddings, normalized_cand_embeddings.T)

        # 3. Thực thi thuật toán MMR chọn từng sản phẩm tối ưu
        unselected = list(range(len(candidates)))
        selected = []

        # Bước 1: Chọn sản phẩm có điểm relevance norm cao nhất làm sản phẩm đầu tiên
        best_first = int(np.argmax(norm_scores))
        selected.append(best_first)
        unselected.remove(best_first)

        # Cập nhật thông tin MMR cho sản phẩm đầu tiên
        candidates[best_first]['mmr_score'] = round(float(norm_scores[best_first]), 4)
        candidates[best_first]['diversity_penalty'] = 0.0

        # Bước 2: Chọn các sản phẩm tiếp theo tối đa hóa MMR score
        while len(selected) < min(top_k, len(candidates)) and unselected:
            best_mmr = -1e9
            best_cand_idx = -1
            best_max_sim = 0.0

            for u_idx in unselected:
                # Tìm độ tương đồng lớn nhất với các sản phẩm đã được chọn
                max_sim_to_selected = max([float(sim_matrix[u_idx, s_idx]) for s_idx in selected])
                
                # MMR Score formula
                mmr_val = lam * float(norm_scores[u_idx]) - (1.0 - lam) * max_sim_to_selected

                if mmr_val > best_mmr:
                    best_mmr = mmr_val
                    best_cand_idx = u_idx
                    best_max_sim = max_sim_to_selected

            if best_cand_idx != -1:
                c_item = candidates[best_cand_idx]
                c_item['mmr_score'] = round(float(best_mmr), 4)
                c_item['diversity_penalty'] = round(float(best_max_sim), 4)
                
                selected.append(best_cand_idx)
                unselected.remove(best_cand_idx)

        # 4. Trả về danh sách ứng viên theo thứ tự chọn từ MMR
        reranked_results = [candidates[i] for i in selected]
        return reranked_results
