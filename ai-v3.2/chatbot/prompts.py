"""
Hệ thống Prompt Templates chuyên biệt cho E-Commerce Electronics RAG Chatbot.
Đảm bảo phong cách tư vấn chuyên nghiệp, trung thực (Strict Grounding) và thân thiện.
"""

SYSTEM_PROMPT_ECOMMERCE_RAG = """Bạn là Chuyên gia Tư vấn Bán hàng và Kỹ thuật Điện tử chuyên nghiệp của Hệ thống E-Commerce.
Nhiệm vụ của bạn là giải đáp thắc mắc, báo giá, so sánh và tư vấn mua hàng cho khách hàng một cách chính xác, thân thiện và trung thực.

QUY TẮC BẮT BUỘC:
1. CHỈ TƯ VẤN dựa trên danh sách [DỮ LIỆU SẢN PHẨM TRUY XUẤT] được cung cấp dưới đây. Không tự bịa đặt thông tin, giá bán hay thông số kỹ thuật không có trong dữ liệu.
2. Nếu thông tin khách hàng hỏi KHÔNG CÓ trong dữ liệu, hãy lịch sự thông báo rằng hệ thống chưa có thông tin về sản phẩm/dịch vụ đó và đề xuất các sản phẩm tương tự có sẵn.
3. Khi tư vấn sản phẩm, hãy nêu rõ: Tên sản phẩm, Thương hiệu, Giá bán chính thức, và 2-3 Ưu điểm/Thông số nổi bật.
4. Giữ thái độ lịch sự, chuyên nghiệp, sử dụng ngôn từ tiếng Việt tự nhiên và hỗ trợ nhiệt tình.
"""


def build_rag_user_prompt(query: str, intent: str, entities: list, context_chunks: list) -> str:
    """Tạo User Prompt hoàn chỉnh kết hợp Ngữ cảnh sản phẩm truy xuất và Ý định NLU."""
    
    context_text = ""
    if context_chunks:
        for idx, chunk in enumerate(context_chunks, 1):
            name = chunk.get("name", chunk.get("product_name", "Sản phẩm"))
            brand = chunk.get("brand", "")
            category = chunk.get("category", "")
            price = chunk.get("price", 0)
            price_str = f"{price:,.0f} VNĐ" if isinstance(price, (int, float)) and price > 0 else "Liên hệ báo giá"
            rating = chunk.get("rating", 4.8)
            specs = chunk.get("specs", chunk.get("description", ""))
            
            context_text += f"\n--- [SẢN PHẨM {idx}] ---\n"
            context_text += f"• Tên sản phẩm: {name}\n"
            if brand: context_text += f"• Thương hiệu: {brand}\n"
            if category: context_text += f"• Danh mục: {category}\n"
            context_text += f"• Giá bán: {price_str}\n"
            context_text += f"• Đánh giá: {rating}/5.0 ⭐\n"
            if specs: context_text += f"• Thông số / Mô tả: {specs}\n"
    else:
        context_text = "Không tìm thấy sản phẩm trực tiếp trùng khớp trong kho dữ liệu."

    entities_str = ", ".join([f"{e.get('text')} ({e.get('entity_type')})" for e in entities]) if entities else "Không có"

    user_prompt = f"""[DỮ LIỆU SẢN PHẨM TRUY XUẤT]
{context_text}

[THÔNG TIN PHÂN TÍCH NLU]
- Ý định khách hàng (Intent): {intent}
- Thực thể trích xuất (Entities): {entities_str}

[CÂU HỎI CỦA KHÁCH HÀNG]
"{query}"

Hãy đưa ra câu trả lời tư vấn chi tiết, chính xác và chuyên nghiệp theo đúng Quy tắc bắt buộc."""
    return user_prompt
