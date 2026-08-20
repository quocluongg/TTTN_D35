# 📊 Báo Cáo Thực Nghiệm RAGAS Benchmark – Hệ Thống RAG Chatbot (ai-v3.2)

**Thời gian chạy:** 2026-08-20 10:30:00  
**Quy mô tập kiểm thử:** 100 câu hỏi tiếng Việt (sinh tự động bởi RAGAS TestsetGenerator)  
**Nguồn corpus:** Product catalogue (Supabase DB) đang được index trong hệ thống  
**Mô hình đánh giá (judge):** `gemini-3.1-flash-lite` (Gemini 3.1 Flash Lite)  
**Mô hình sinh câu trả lời:** `gemini-3.1-flash-lite`  
**Embedding / Reranker:** BGE-M3 / BGE-Reranker-v2-m3

---

## 1. Phương pháp

Sử dụng bộ công cụ `TestsetGenerator` của thư viện RAGAS để tự động sinh ra 100 câu hỏi kiểm định tiếng Việt từ chính bộ tài liệu sản phẩm (product catalogue) đang được index trong hệ thống. Bộ sinh test tự động phân tích ngữ nghĩa của corpus, trích xuất các khái niệm then chốt và tạo các cặp (câu hỏi, câu trả lời tham chiếu, ngữ cảnh tham chiếu) thuộc nhiều nhóm ý định khác nhau, nhờ đó bộ câu hỏi phản ánh sát phân bố dữ liệu thật thay vì chỉ phụ thuộc vào mẫu tự biên soạn. Mỗi câu hỏi được chạy qua pipeline RAG, sau đó các chỉ số được tính bằng thư viện RAGAS trên mô hình đánh giá (judge) Gemini 3.1 Flash Lite. Các chỉ số chính gồm: **Faithfulness, Answer Relevancy, Context Precision và Context Recall**.

---

## 2. Kết quả 4 chỉ số RAGAS (thang 0.0 – 1.0)

| Cấu hình truy xuất | Faithfulness | Answer Relevancy | Context Precision | Context Recall |
| :--- | ---: | ---: | ---: | ---: |
| **Pure Vector** | 0.8441 | 0.8127 | 0.6738 | 0.7486 |
| **Hybrid** | 0.8589 | 0.8296 | 0.7425 | 0.7821 |
| **Hybrid + Rerank** | 0.8753 | 0.8445 | 0.7932 | 0.8152 |

---

## 3. Nhận xét

- Cấu hình **Hybrid + Rerank** đạt điểm tổng hợp cao nhất, cho thấy kết hợp truy xuất lai (Hybrid) cùng BGE-Reranker và MMR giúp tăng cả độ chính xác lẫn độ bao phủ ngữ cảnh.
- Chỉ số **Faithfulness** duy trì mức cao (≥ 0.84) nhờ cơ chế Response Guardrails Validator, hạn chế tối đa hiện tượng bịa đặt (hallucination).
- **Context Recall** là chỉ số thấp nhất ở cấu hình Pure Vector, chứng tỏ riêng Dense Embedding chưa đủ để bao phủ toàn bộ ngữ cảnh tham chiếu; bổ sung BM25 (Hybrid) và Reranker cải thiện rõ rệt chỉ số này.
