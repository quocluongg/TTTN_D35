"""
Prompt Builder: Xây dựng Prompt tiếng Việt tối ưu cho LLM.
Phân chia ngữ cảnh (context) theo từng sản phẩm riêng biệt nếu là câu hỏi so sánh hoặc nhiều sản phẩm.
"""
from typing import Dict, List
from retrieval.hybrid_retriever import RetrievedDocument
from nlu.schema import NLUResult


def build_prompt(query: str, retrieved_docs: List[RetrievedDocument], nlu_result: NLUResult | None = None) -> str:
    """
    IPO Model:
    - Input:
        - query: Câu hỏi truy vấn từ người dùng
        - retrieved_docs: Danh sách các tài liệu RetrievedDocument thu thập được từ bước Retrieval
        - nlu_result: Kết quả phân tích NLU (tùy chọn)
    - Process:
        Step 1: Kiểm tra danh sách retrieved_docs rỗng -> tạo chuỗi context rỗng
        Step 2: Nhóm các đoạn văn bản tài liệu theo tên sản phẩm (product_name)
        Step 3: Tạo các khối CONTEXT tiếng Việt định dạng rõ ràng theo từng sản phẩm
        Step 4: Định nghĩa System Instructions hướng dẫn AI tư vấn chuẩn mực
        Step 5: Ghép nối System Instructions + Context Blocks + User Query
    - Output: Chuỗi full_prompt hoàn chỉnh gửi tới mô hình LLM
    """
    # Step 1: Kiểm tra xem có tài liệu ngữ cảnh nào được truyền vào hay không
    if not retrieved_docs:
        context_str = "Không tìm thấy thông tin phù hợp trong cơ sở dữ liệu."
    else:
        # Step 2: Nhóm tài liệu theo product_name để phân định ngữ cảnh rõ ràng
        grouped_docs: Dict[str, List[str]] = {}
        for doc in retrieved_docs:
            product_name = doc.metadata.get("product_name") or doc.metadata.get("name") or doc.metadata.get("product_id", "Sản phẩm")
            if product_name not in grouped_docs:
                grouped_docs[product_name] = []
            grouped_docs[product_name].append(doc.text)

        # Step 3: Tạo các khối ngữ cảnh (context blocks) theo từng sản phẩm
        context_blocks = []
        for product_name, texts in grouped_docs.items():
            combined_texts = "\n---\n".join(texts)
            context_blocks.append(f"CONTEXT - {product_name}:\n{combined_texts}")

        context_str = "\n\n====================\n\n".join(context_blocks)

    # Step 4: Thiết lập chỉ dẫn hệ thống (System Instructions) đảm bảo AI trả lời ngắn gọn như nhân viên bán hàng
    system_instructions = (
        "Bạn là Nhân viên Tư vấn Bán hàng chuyên nghiệp của hệ thống ShopWise (Máy tính, Điện thoại, Phụ kiện).\n"
        "Hãy xưng 'em' và gọi khách là 'anh/chị'. Trả lời đi thẳng vào vấn đề, lịch sự, thân thiện và trung thực.\n\n"
        "Quy tắc bắt buộc:\n"
        "1. NGẮN GỌN & CÔ ĐỌNG: Trả lời trong 2-4 câu hoặc vài gạch đầu dòng ngắn gọn. KHÔNG dán nguyên đoạn văn dài lê thê.\n"
        "2. CHỈ dựa vào thông tin có trong CONTEXT. Không tự bịa đặt thông số, mức giá, khuyến mãi hay quà tặng.\n"
        "3. KHI THIẾU THÔNG TIN: Báo nhẹ nhàng 'Dạ hiện tại hệ thống em chưa có thông tin chi tiết về sản phẩm này' và gợi ý sản phẩm liên quan.\n"
        "4. KẾT THÚC CÂU HỎI MỞ: Luôn chốt bằng 1 câu hỏi mở gợi ý hỗ trợ/đặt hàng (vd: 'Anh/chị có muốn em hỗ trợ lên đơn ngay không ạ?')."
    )

    # Step 5: Ghép System Instructions, Context và Query của khách hàng thành Prompt hoàn chỉnh
    full_prompt = (
        f"{system_instructions}\n\n"
        f"THÔNG TIN THAM KHẢO (CONTEXT):\n"
        f"{context_str}\n\n"
        f"CÂU HỎI CỦA KHÁCH HÀNG: {query}\n\n"
        f"CÂU TRẢ LỜI CỦA SHOPWISE AI:"
    )

    return full_prompt

