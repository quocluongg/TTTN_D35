"""
Interactive CLI Chatbot Interface with Product Cards Rendering for SHOPWISE AI Engine v3.2.
Khởi chạy: python cli.py
"""

import sys
import os
import time
import logging

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Append project directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from core.pineline import RAGChatbotPipeline
from chatbot.cli_renderer import render_cli_response, render_product_cards_list

# Setup quiet logging for CLI
logging.basicConfig(level=logging.ERROR)


def run_cli_interactive():
    print("\n" + "=" * 76)
    print("🤖 SHOPWISE AI ASSISTANT v3.2 — INTERACTIVE CLI CHATBOT")
    print("=" * 76)
    print("• Gõ 'exit' hoặc 'quit' để thoát CLI.")
    print("• Gõ 'new' để bắt đầu cuộc trò chuyện mới (Reset Linked Messages chain).")
    print("• Gõ câu hỏi của bạn và nhấn Enter để nhận câu trả lời kèm Product Cards.")
    print("=" * 76 + "\n")

    print("[CLI] Đang khởi tạo RAG Pipeline & AI Models (vui lòng chờ)...")
    pipeline = RAGChatbotPipeline()
    print("[CLI] Hệ thống AI đã sẵn sàng!\n")

    conversation_id = None
    last_message_id = None

    while True:
        try:
            query = input("💬 Bạn (Customer): ").strip()
        except (KeyboardInterrupt, EOFError):
            print("\n👋 Cảm ơn bạn đã sử dụng ShopWise AI CLI Chatbot. Tạm biệt!")
            break

        if not query:
            continue

        query_lower = query.lower()
        if query_lower in ["exit", "quit", "q"]:
            print("\n👋 Cảm ơn bạn đã sử dụng ShopWise AI CLI Chatbot. Tạm biệt!")
            break

        if query_lower == "new":
            conversation_id = None
            last_message_id = None
            print("\n✨ [System] Đã tạo cuộc trò chuyện mới! Chuỗi tin nhắn liên kết đã được đặt lại.\n")
            continue

        # Processing query through pipeline
        print("⏳ Đang xử lý câu hỏi & nạp dữ liệu sản phẩm...")
        start_time = time.time()
        result = pipeline.process_query(
            query=query,
            conversation_id=conversation_id,
            parent_id=last_message_id
        )
        elapsed = round(time.time() - start_time, 2)

        # Update conversation pointers
        conversation_id = result.get("conversation_id")
        last_message_id = result.get("message_id")

        # Render response and Product Cards
        render_cli_response(result)


def run_cli_single_query(query: str):
    print(f"\n[CLI Query] \"{query}\"")
    pipeline = RAGChatbotPipeline()
    result = pipeline.process_query(query=query)
    render_cli_response(result)


if __name__ == "__main__":
    if len(sys.argv) > 1:
        single_q = " ".join(sys.argv[1:])
        run_cli_single_query(single_q)
    else:
        run_cli_interactive()
