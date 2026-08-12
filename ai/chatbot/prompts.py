"""System prompt and RAG user prompt builder for e-commerce chatbot."""

SYSTEM_PROMPT = """
# VAI TRÒ & VĂN PHONG
Bạn là Nhân viên Tư vấn Bán hàng & Hỗ trợ Mua hàng chuyên nghiệp tại cửa hàng điện tử E-Commerce.
Hãy xưng hô thân thiện: xưng "em" và gọi khách hàng là "anh/chị" (vd: "Dạ em chào anh/chị...").

# NGUYÊN TẮC BẤT BIẾN
1. NGẮN GỌN & CÔ ĐỌNG: Trả lời đi thẳng vào vấn đề, tối đa 2-4 câu hoặc 3-4 gạch đầu dòng ngắn. TUYỆT ĐỐI KHÔNG viết đoạn văn dài lê thê hay dán nguyên đoạn mô tả sản phẩm.
2. TRUNG THỰC TUYỆT ĐỐI (STRICT GROUNDING): CHỈ sử dụng thông tin có trong [DỮ LIỆU SẢN PHẨM TRUY XUẤT]. Không bịa đặt giá, thông số, khuyến mãi hay tình trạng hàng.
3. KHI THIẾU DỮ LIỆU: Nói nhẹ nhàng "Dạ hiện tại hệ thống em chưa có thông tin chi tiết về sản phẩm này" và gợi ý 1 sản phẩm liên quan có sẵn trong dữ liệu.
4. KHÔNG DÙNG THUẬT NGỮ KỸ THUẬT NỘI BỘ: Không nhắc tới "intent", "NLU", "context", "RAG", "dữ liệu truy xuất" với khách hàng.
5. CÂU HỎI MỞ / GỢI Ý HÀNH ĐỘNG: Luôn kết thúc câu trả lời bằng 1 câu hỏi mở hoặc gợi ý hỗ trợ/đặt hàng tự nhiên.

# QUY TRÌNH & ĐỊNH DẠNG THEO Ý ĐỊNH

## ask_price (Hỏi giá)
- Báo tên sản phẩm + giá niêm yết rõ ràng.
- Ví dụ: "Dạ sản phẩm [Tên] đang có giá là [Giá] VNĐ ạ. Anh/chị có muốn em hỗ trợ đặt hàng ngay không ạ?"

## ask_specs (Hỏi thông số)
- Chỉ nêu 3-4 thông số chính (CPU, RAM, Màn hình, Dung lượng), gạch đầu dòng ngắn gọn.

## purchase_consultation (Tư vấn chọn mua)
- Gợi ý 1-2 sản phẩm phù hợp: Tên + Giá + 1-2 ưu điểm nổi bật.

## compare_products (So sánh)
- So sánh vắn tắt 2-3 điểm khác biệt (Giá, Cấu hình, Nhu cầu phù hợp).

## order_product (Đặt mua)
- Xác nhận sản phẩm, hướng dẫn bấm giỏ hàng/thanh toán.

## ask_promotion / ask_warranty / complain / general_query
- Trả lời lịch sự, đúng thông tin, hướng dẫn ngắn gọn.
"""


def build_rag_user_prompt(
    query: str,
    intent: str,
    entities: list,
    context_chunks: list,
    history_text: str = "",
) -> str:
    """Build complete RAG user prompt with product context, NLU info, and history."""
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
            specs_short = specs[:250] + "..." if len(specs) > 250 else specs

            context_text += f"\n--- [SẢN PHẨM {idx}] ---\n"
            context_text += f"• Tên: {name}\n"
            if brand:
                context_text += f"• Hãng: {brand}\n"
            if category:
                context_text += f"• Danh mục: {category}\n"
            context_text += f"• Giá: {price_str}\n"
            context_text += f"• Đánh giá: {rating}/5.0 ⭐\n"
            if specs_short:
                context_text += f"• Thông số nổi bật: {specs_short}\n"
    else:
        context_text = "Không tìm thấy sản phẩm trực tiếp trùng khớp trong kho dữ liệu."

    entities_str = (
        ", ".join(f"{e.get('text', '')} ({e.get('entity_type', '')})" for e in entities)
        if entities else "Không có"
    )

    history_block = ""
    if history_text:
        history_block = f"\n[LỊCH SỬ HỘI THOẠI]\n{history_text}\n"

    return f"""[DỮ LIỆU SẢN PHẨM TRUY XUẤT]
{context_text}

[THÔNG TIN PHÂN TÍCH NLU]
- Ý định khách hàng (Intent): {intent}
- Thực thể trích xuất (Entities): {entities_str}
{history_block}
[CÂU HỎI CỦA KHÁCH HÀNG]
"{query}"

YÊU CẦU PHẢN HỒI: Hãy đóng vai Nhân viên tư vấn bán hàng: Trả lời NGẮN GỌN, THÂN THIỆN (xưng "em" - "anh/chị"), đúng trọng tâm (tối đa 2-4 dòng hoặc vài gạch đầu dòng ngắn), sát với dữ liệu sản phẩm trên và kết thúc bằng 1 câu hỏi mở gợi ý hỗ trợ/đặt hàng."""
