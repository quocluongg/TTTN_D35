# 📊 Báo Cáo Đánh Giá Thực Nghiệm RAGAS Benchmark (Ablation Study)

**Hệ thống Đánh giá:** RAGAS Evaluation Framework (Retrieval-Augmented Generation Assessment)  
**Tập dữ liệu Kiểm thử:** 100 câu hỏi tiếng Việt tự động sinh bởi `TestsetGenerator` từ Product Catalogue  
**LLM Judge:** `Gemini 3.1 Flash Lite` (Google AI Studio)  
**Thời gian thực thi:** 2026-08-20 02:27:31  

---

## 🔬 1. Trích Đoạn Minh Chứng Phương Pháp Đánh Giá (Thesis Excerpt)

> *"Nhóm sử dụng bộ công cụ TestsetGenerator của thư viện RAGAS để tự động sinh ra 100 câu hỏi kiểm định tiếng Việt từ chính bộ tài liệu sản phẩm (product catalogue) đang được index trong hệ thống. Bộ sinh test tự động phân tích ngữ nghĩa của corpus, trích xuất các khái niệm then chốt và tạo các cặp (câu hỏi, câu trả lời tham chiếu, ngữ cảnh tham chiếu) thuộc nhiều nhóm ý định khác nhau, nhờ đó bộ câu hỏi phản ánh sát phân bố dữ liệu thật thay vì chỉ phụ thuộc vào mẫu tự biên soạn. Mỗi câu hỏi được chạy qua pipeline, sau đó các chỉ số được tính bằng thư viện RAGAS trên mô hình đánh giá (judge) Gemini 3.1 Flash Lite. Các chỉ số chính gồm: Faithfulness, Answer Relevancy, Context Precision và Context Recall."*

---

## 📈 2. Bảng Kết Quả Thực Nghiệm (Ablation Study Comparison)

| Cấu hình RAG Pipeline | Faithfulness | Answer Relevancy | Context Precision | Context Recall | Overall Score | Latency (Mean) |
| :-------------------- | :----------: | :--------------: | :---------------: | :------------: | :-----------: | :------------: |
| **Pure Vector** | 0.8441 | 0.8127 | 0.6738 | 0.7486 | **0.7698** | 385.4 ms |
| **Hybrid (Vector + BM25)** | 0.8589 | 0.8296 | 0.7425 | 0.7821 | **0.8033** | 442.8 ms |
| **Hybrid + Rerank (Đề xuất)** | **0.8753** | **0.8445** | **0.7932** | **0.8152** | **0.8321** | 612.3 ms |

---

## 🔍 3. Phân Tích Chuyên Sâu Khoa Học (Scientific Findings)

1. **Khả năng Truy xuất Ngữ cảnh (Retrieval Performance):**
   * **Context Precision:** Tăng đột phá từ **0.6738 (Pure Vector)** lên **0.7425 (Hybrid)** (+10.2%) và đạt **0.7932 (Hybrid + Rerank)** (+17.7%). Nguyên nhân do tìm kiếm Lexical BM25 bổ trợ xuất sắc việc lọc từ khóa chính xác (tên sản phẩm, mã model, số dung lượng RAM/SSD) mà Dense Vector đôi khi bỏ qua.
   * **Context Recall:** Tăng từ **0.7486** lên **0.8152** nhờ mô hình Cross-Encoder Reranker đẩy các đoạn văn bản giàu thông tin cốt lõi lên top-K kết quả đầu tiên.

2. **Khả năng Sinh Câu trả lời (Generation Quality):**
   * **Faithfulness (Chống bịa đặt):** Đạt **0.8753** trên cấu hình Hybrid + Rerank. Việc cung cấp đúng và đủ ngữ cảnh chính xác giúp LLM Gemini 3.1 Flash Lite giảm thiểu hiện tượng ảo giác (hallucination), không tự bịa giá hay thông số kỹ thuật.
   * **Answer Relevancy (Độ bám sát câu hỏi):** Đạt **0.8445**, câu trả lời ngắn gọn, trực diện vào nhu cầu khách hàng (tư vấn mua hàng, so sánh sản phẩm, bảo hành).

3. **Kiểm Định Ý Nghĩa Thống Kê (Statistical Significance):**
   * Paired t-test giữa **Hybrid** vs **Pure Vector**: `t = 13.2449`, `p = 0.0 < 0.05` -> Sự cải thiện mang ý nghĩa thống kê vượt trội.
   * Paired t-test giữa **Hybrid + Rerank** vs **Hybrid**: `t = 9.4918`, `p = 0.0 < 0.05` -> Việc tích hợp Reranker mang lại hiệu quả rõ rệt.

---

## 📁 4. Danh Mục Minh Chứng & File Đính Kèm (Artifacts)

* **Bộ Testset 100 câu hỏi:** [`ragas_synthetic_testset_100.json`](file:///D:/StudySpace/Dev Workspace/TTTN_D35/ai-v3/eval/ragas_synthetic_testset_100.json)
* **File JSON Kết quả Chi tiết 300 lượt chạy:** [`ragas_eval_ablation_results.json`](file:///D:/StudySpace/Dev Workspace/TTTN_D35/ai-v3/eval/ragas_eval_ablation_results.json)
* **Log Nhật ký Thực thi Hệ thống:** [`logs/ragas_benchmark_execution.log`](file:///D:/StudySpace/Dev Workspace/TTTN_D35/ai-v3/eval/logs/ragas_benchmark_execution.log)
