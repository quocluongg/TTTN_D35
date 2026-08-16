"""
CLI Card Product Renderer for SHOPWISE AI Engine v3.2.
Hiển thị Card Product đẹp mắt trong giao diện dòng lệnh (Terminal/CLI).
"""

from typing import List, Dict, Any, Optional


def render_product_card(product: Dict[str, Any], index: int = 1, width: int = 74) -> str:
    """Vẽ 1 Card Product dạng Terminal Box đẹp mắt."""
    name = product.get("name", "Sản phẩm")
    brand = product.get("brand", "N/A")
    category = product.get("category_name") or product.get("category", "N/A")
    price = product.get("price_from") or product.get("price", 0)
    rating = product.get("rating_avg") or product.get("rating", 4.8)
    reviews = product.get("review_count") or product.get("reviews_count", 0)
    url = product.get("product_url") or f"/product/{product.get('slug', '')}"

    price_str = f"{price:,.0f} VNĐ".replace(",", ".") if isinstance(price, (int, float)) and price > 0 else "Liên hệ"

    title_line = f" 🛒 [{index}] {name.upper()}"
    line1 = f" 🏷️  Hãng: {brand:<18} 📁 Danh mục: {category}"
    line2 = f" 💰 Giá: {price_str:<19} ⭐ Đánh giá: {rating}/5.0 ({reviews} lượt)"
    line3 = f" 🔗 URL: {url}"

    # Cắt ngắn nếu dài hơn khung
    top_border    = "┌" + "─" * (width - 2) + "┐"
    sep_border    = "├" + "─" * (width - 2) + "┤"
    bot_border    = "└" + "─" * (width - 2) + "┘"

    def pad_line(content: str) -> str:
        # Xử lý độ dài hiển thị ký tự (khoảng chừng Unicode)
        visible_len = len(content.encode('utf-8').decode('utf-8'))
        pad = width - 4 - visible_len
        if pad < 0:
            content = content[:width - 7] + "..."
            pad = 0
        return f"│ {content}{' ' * pad} │"

    card_str = [
        top_border,
        pad_line(title_line),
        sep_border,
        pad_line(line1),
        pad_line(line2),
        pad_line(line3),
        bot_border
    ]

    return "\n".join(card_str)


def render_product_cards_list(products: List[Dict[str, Any]], title: str = "📦 SẢN PHẨM GỢI Ý (PRODUCT CARDS):") -> str:
    """In danh sách các Card Products trong Terminal CLI."""
    if not products:
        return ""

    output = [f"\n{title}"]
    for idx, p in enumerate(products, 1):
        output.append(render_product_card(p, index=idx))

    return "\n".join(output)


def render_cli_response(result: Dict[str, Any]) -> None:
    """In toàn bộ phản hồi RAG Chatbot gồm text, Product Cards và Linked Message Metadata ra Terminal CLI."""
    answer = result.get("response") or result.get("answer") or ""
    intent = result.get("intent", "unknown")
    confidence = result.get("confidence", 0)
    products = result.get("products") or []
    conv_id = result.get("conversation_id", "")
    msg_id = result.get("message_id", "")
    parent_id = result.get("parent_id", "")
    history_len = result.get("history_length", 0)

    print("\n" + "=" * 76)
    print("🤖 SHOPWISE AI ASSISTANT:")
    print("=" * 76)
    print(answer)

    # Render Product Cards
    if products:
        print(render_product_cards_list(products))

    # Render Metadata & Linked Message Info
    print("\n" + "-" * 76)
    msg_short = msg_id[:8] if msg_id else "N/A"
    parent_short = parent_id[:8] if parent_id else "root"
    conv_short = conv_id[:8] if conv_id else "N/A"
    print(f"📊 Intent: {intent} (conf: {confidence*100:.0f}%) | 🔗 Conv: {conv_short}... | Msg: {msg_short} ⬅️ Parent: {parent_short} ({history_len} turns history)")
    print("-" * 76 + "\n")
