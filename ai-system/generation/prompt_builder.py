"""
Prompt Builder: Xây dựng Prompt tiếng Việt tối ưu cho LLM.
Phân chia ngữ cảnh (context) theo từng sản phẩm riêng biệt nếu là câu hỏi so sánh hoặc nhiều sản phẩm.
"""
from typing import Dict, List
from retrieval.hybrid_retriever import RetrievedDocument
from nlu.schema import NLUResult


def build_prompt(query: str, retrieved_docs: List[RetrievedDocument], nlu_result: NLUResult | None = None) -> str:
    """
    Xây dựng prompt hoàn chỉnh gửi tới LLM.
    """
    if not retrieved_docs:
        context_str = "Không tìm thấy thông tin phù hợp trong cơ sở dữ liệu."
    else:
        # Nhóm tài liệu theo product_id / product_name
        grouped_docs: Dict[str, List[str]] = {}
        for doc in retrieved_docs:
            product_name = doc.metadata.get("product_name") or doc.metadata.get("name") or doc.metadata.get("product_id", "Sản phẩm")
            if product_name not in grouped_docs:
                grouped_docs[product_name] = []
            grouped_docs[product_name].append(doc.text)

        context_blocks = []
        for product_name, texts in grouped_docs.items():
            combined_texts = "\n---\n".join(texts)
            context_blocks.append(f"CONTEXT - {product_name}:\n{combined_texts}")

        context_str = "\n\n====================\n\n".join(context_blocks)

    system_instructions = (
        "Bạn là Chuyên viên tư vấn AI thông minh của hệ thống ShopWise chuyên cung cấp thiết bị công nghệ (Máy tính, Điện thoại, Phụ kiện).\n"
        "Nhiệm vụ của bạn là trả lời câu hỏi của khách hàng một cách lịch sự, chính xác và trung thực dựa trên thông tin CONTEXT được cung cấp dưới đây.\n\n"
        "Quy tắc bắt buộc:\n"
        "1. CHỈ dựa vào thông tin có trong CONTEXT. Không tự bịa đặt thông số, mức giá, chương trình khuyến mãi hay thông tin ngoài CONTEXT.\n"
        "2. Nếu trong CONTEXT không có thông tin để trả lời, hãy lịch sự thông báo cho khách hàng biết rằng chưa có dữ liệu chính xác về sản phẩm đó.\n"
        "3. Nếu là câu hỏi SO SÁNH nhiều sản phẩm, hãy trình bày ngắn gọn, so sánh rõ ràng các điểm chính (màn hình, chip, RAM, giá...) theo dạng danh sách hoặc bảng.\n"
        "4. Trả lời bằng tiếng Việt chuẩn mực, thân thiện và mạch lạc."
    )

    full_prompt = (
        f"{system_instructions}\n\n"
        f"THÔNG TIN THAM KHẢO (CONTEXT):\n"
        f"{context_str}\n\n"
        f"CÂU HỎI CỦA KHÁCH HÀNG: {query}\n\n"
        f"CÂU TRẢ LỜI CỦA SHOPWISE AI:"
    )

    return full_prompt
