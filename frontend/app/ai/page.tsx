"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  Plus, 
  Search, 
  Image as ImageIcon, 
  Paperclip, 
  ArrowUp, 
  MessageSquare, 
  Bot, 
  User, 
  ArrowLeft,
  Trash2,
  Sparkles,
  ChevronRight
} from "lucide-react";

interface ProductSuggestion {
  id: string;
  name: string;
  price: string;
  imageUrl: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  products?: ProductSuggestion[];
}

export default function AIChatPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{ id: string; title: string }>>([
    { id: "h1", title: "Tìm laptop chơi game tầm 25 triệu" },
    { id: "h2", title: "Chọn iPhone 15 hay iPhone 16?" },
    { id: "h3", title: "Tai nghe bluetooth dưới 1 triệu" },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Suggestions adapted for the tech store
  const suggestions = [
    { text: "TƯ VẤN LAPTOP CHƠI GAME TẦM TRUNG", query: "Tư vấn cho mình một vài mẫu laptop chơi game tầm giá 25-30 triệu tốt nhất hiện nay." },
    { text: "TÌM ĐIỆN THOẠI CHỤP ẢNH ĐẸP", query: "Mình muốn tìm điện thoại chụp ảnh đẹp sắc nét để đi du lịch." },
    { text: "GỢI Ý PHỤ KIỆN LÀM VIỆC DƯỚI 1 TRIỆU", query: "Gợi ý cho mình bàn phím hoặc chuột công thái học làm việc tầm giá dưới 1 triệu." },
    { text: "MÁY TÍNH HỌC TẬP - VĂN PHÒNG GỌN NHẸ", query: "Tìm ultrabook mỏng nhẹ, pin trâu cho học sinh sinh viên học tập văn phòng." },
    { text: "SO SÁNH IPHONE 15 PRO VÀ 16 PRO", query: "So sánh cấu hình và camera giữa iPhone 15 Pro và iPhone 16 Pro." },
  ];

  // Dummy mock response generator based on tech query keywords
  const handleSend = (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: textToSend,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    // Simulate AI thinking and typing response
    setTimeout(() => {
      let aiContent = "Chào bạn! Tôi đã phân tích nhu cầu của bạn. Dưới đây là các sản phẩm công nghệ nổi bật được đánh giá cao và phù hợp nhất với yêu cầu của bạn tại cửa hàng:";
      let suggestedProducts: ProductSuggestion[] = [];

      const queryLower = textToSend.toLowerCase();

      if (queryLower.includes("laptop") || queryLower.includes("chơi game") || queryLower.includes("game") || queryLower.includes("máy tính")) {
        aiContent = "Dựa trên nhu cầu tìm kiếm máy tính/laptop của bạn, tôi gợi ý 2 dòng máy tính xách tay cấu hình mạnh mẽ, tản nhiệt tốt, phù hợp nhất cho công việc và giải trí:";
        suggestedProducts = [
          {
            id: "2",
            name: "Laptop Acer Aspire 5 Vero AV15-51-58HB",
            price: "15.990.000đ",
            imageUrl: "https://cdn2.cellphones.com.vn/200x/media/catalog/product/_/0/_0007_oe-fclv0w_2eshjbzdkkuvo8u87hm22b.jpg",
          },
          {
            id: "36",
            name: "Laptop Lenovo Ideapad 3 14IAU7 82RJ0019VN",
            price: "12.490.000đ",
            imageUrl: "https://cdn2.cellphones.com.vn/200x/media/catalog/product/t/e/tecno-spark-go-4-black.jpg", // placeholder if not exists
          }
        ];
      } else if (queryLower.includes("iphone") || queryLower.includes("điện thoại") || queryLower.includes("ảnh") || queryLower.includes("chụp")) {
        aiContent = "Đối với nhu cầu tìm kiếm điện thoại thông minh chụp ảnh sắc nét, cấu hình cao và thời thượng, bạn có thể tham khảo sản phẩm dưới đây:";
        suggestedProducts = [
          {
            id: "1",
            name: "Apple iPhone 7 Plus 128GB Đỏ",
            price: "8.990.000đ",
            imageUrl: "https://cdn2.cellphones.com.vn/200x/media/catalog/productno_selection",
          }
        ];
      } else {
        // Fallback to accessories/general
        aiContent = "Tôi gợi ý cho bạn một số món phụ kiện công nghệ chính hãng bán chạy hàng đầu tuần này phù hợp với tầm giá tìm kiếm:";
        suggestedProducts = [
          {
            id: "3",
            name: "Ốp lưng iPhone 16 Spigen Parallax With Magsafe",
            price: "450.000đ",
            imageUrl: "https://cdn2.cellphones.com.vn/200x/media/catalog/product/o/p/op-lung-iphone-16-spigen-parallax-with-magsafe_1_1.png",
          },
          {
            id: "8",
            name: "Tai nghe Bluetooth Gaming Baseus AeQur GH02",
            price: "890.000đ",
            imageUrl: "https://cdn2.cellphones.com.vn/200x/media/catalog/product/o/p/op-lung-iphone-16-spigen-parallax-with-magsafe_1_1.png",
          }
        ];
      }

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: aiContent,
        products: suggestedProducts,
      };

      setMessages((prev) => [...prev, aiMsg]);
      setLoading(false);

      // Add to history list if it's the first message
      if (messages.length === 0) {
        const title = textToSend.length > 25 ? textToSend.substring(0, 25) + "..." : textToSend;
        setChatHistory((prev) => [{ id: Date.now().toString(), title }, ...prev]);
      }
    }, 1200);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setInput("");
  };

  const deleteHistory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setChatHistory((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white dark:bg-zinc-950 text-black dark:text-white transition-colors duration-300">
      
      {/* SIDEBAR */}
      <aside className="w-[280px] border-r border-black/10 dark:border-zinc-800 bg-[#F2F2F2] dark:bg-zinc-900/50 flex flex-col justify-between h-full shrink-0 hidden md:flex">
        <div className="flex flex-col p-4 space-y-6 overflow-y-auto">
          {/* Header & Back Link */}
          <div className="flex items-center justify-between pb-2 border-b border-black/10 dark:border-zinc-800">
            <Link href="/shop" className="flex items-center gap-2 text-sm font-semibold hover:opacity-75">
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại Cửa hàng</span>
            </Link>
            <Sparkles className="w-5 h-5 text-lime-500 fill-lime-500/20" />
          </div>

          {/* New Chat Button */}
          <button 
            onClick={startNewChat}
            className="flex items-center justify-between px-4 py-3 bg-white dark:bg-zinc-800 border border-black dark:border-zinc-700 text-sm font-semibold hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all duration-300 rounded-none cursor-pointer"
          >
            <span>Đoạn chat mới</span>
            <Plus className="w-4 h-4" />
          </button>

          {/* Search History */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Tìm đoạn chat..." 
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-zinc-800 border border-black/10 dark:border-zinc-700 text-xs focus:outline-hidden placeholder-zinc-400 rounded-none"
            />
          </div>

          {/* History List */}
          <div className="space-y-4">
            <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              Lịch sử tìm kiếm
            </div>
            
            <div className="space-y-1">
              {chatHistory.map((item) => (
                <div 
                  key={item.id}
                  onClick={() => handleSend(item.title)}
                  className="group flex items-center justify-between px-3 py-2.5 hover:bg-black/5 dark:hover:bg-white/5 text-sm font-medium cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <MessageSquare className="w-4 h-4 text-zinc-400 shrink-0" />
                    <span className="truncate">{item.title}</span>
                  </div>
                  <button 
                    onClick={(e) => deleteHistory(item.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 rounded-sm transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* User Info / Settings Footer */}
        <div className="p-4 border-t border-black/10 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-black text-white dark:bg-white dark:text-black flex items-center justify-center font-bold text-sm">
              AI
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold leading-tight">ElectroAI v1.0</span>
              <span className="text-[10px] text-zinc-500 leading-none">Powered by Gemini</span>
            </div>
          </div>
        </div>
      </aside>

      {/* CHAT AREA */}
      <main className="flex-1 flex flex-col h-full relative">
        {/* Mobile Header */}
        <header className="h-[60px] border-b border-black/15 dark:border-zinc-800 flex items-center justify-between px-4 md:px-8 bg-white dark:bg-zinc-950 z-10">
          <div className="flex items-center gap-3">
            <Link href="/shop" className="md:hidden p-2 -ml-2 text-zinc-600 dark:text-zinc-300">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-lime-500" />
              <span className="text-[18px] font-bold">ElectroAI Assistant</span>
            </div>
          </div>
          <button 
            onClick={startNewChat}
            className="md:hidden flex items-center gap-1.5 px-3 py-1.5 border border-black text-xs font-bold bg-white text-black hover:bg-black hover:text-white transition-colors"
          >
            <span>Mới</span>
            <Plus className="w-3.5 h-3.5" />
          </button>
        </header>

        {/* Messages Log or Landing Screen */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 bg-[#FDFDFD] dark:bg-zinc-950/20">
          {messages.length === 0 ? (
            /* LANDING SCREEN */
            <div className="max-w-[720px] mx-auto pt-[8vh] flex flex-col items-center justify-center text-center space-y-12">
              
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-black text-white dark:bg-white dark:text-black text-xs font-bold uppercase tracking-widest rounded-none">
                  <Sparkles className="w-3.5 h-3.5 text-lime-400 fill-lime-400/20" />
                  <span>Trợ lý mua sắm AI</span>
                </div>
                <h2 className="text-[32px] md:text-[48px] font-medium tracking-tight leading-tight">
                  Mô tả nhu cầu.<br />Tôi sẽ tìm sản phẩm phù hợp.
                </h2>
              </div>

              {/* Central Text Area Input */}
              <div className="w-full bg-white dark:bg-zinc-900 border border-black dark:border-zinc-800 p-4 shadow-xs space-y-3 relative group focus-within:border-lime-500 dark:focus-within:border-lime-400 transition-colors">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Tôi muốn tìm một chiếc điện thoại chụp ảnh sắc nét, pin trâu..."
                  className="w-full min-h-[90px] bg-transparent border-none outline-hidden resize-none text-[16px] text-black dark:text-white placeholder-zinc-400"
                />
                
                <div className="flex items-center justify-between pt-2 border-t border-black/5 dark:border-zinc-800">
                  <div className="flex items-center gap-3 text-zinc-400">
                    <button className="hover:text-black dark:hover:text-white cursor-pointer transition-colors p-1">
                      <ImageIcon className="w-4 h-4" />
                    </button>
                    <button className="hover:text-black dark:hover:text-white cursor-pointer transition-colors p-1">
                      <Paperclip className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <button 
                    onClick={() => handleSend(input)}
                    disabled={!input.trim()}
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                      input.trim() 
                        ? "bg-black text-white dark:bg-white dark:text-black cursor-pointer hover:bg-lime-400 hover:text-black dark:hover:bg-lime-400 dark:hover:text-black" 
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-300 dark:text-zinc-600 cursor-not-allowed"
                    }`}
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Suggestions Section */}
              <div className="w-full space-y-4">
                <div className="text-xs uppercase font-bold text-zinc-400 tracking-wider">
                  Hoặc bắt đầu bằng các câu hỏi gợi ý
                </div>
                
                <div className="flex flex-wrap justify-center gap-2 max-w-[640px] mx-auto">
                  {suggestions.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(item.query)}
                      className="px-4 py-2 border border-black/25 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-semibold hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all cursor-pointer rounded-full"
                    >
                      {item.text}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          ) : (
            /* ACTIVE CHAT LOG */
            <div className="max-w-[760px] mx-auto space-y-8 pb-32">
              {messages.map((msg) => (
                <div key={msg.id} className="flex gap-4">
                  {/* Avatar */}
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                    msg.role === "assistant" 
                      ? "bg-lime-400 text-black border border-black" 
                      : "bg-black text-white dark:bg-white dark:text-black"
                  }`}>
                    {msg.role === "assistant" ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>

                  {/* Bubble Content */}
                  <div className="flex-1 space-y-4">
                    <div className="text-xs font-bold text-zinc-400 uppercase tracking-wide">
                      {msg.role === "assistant" ? "ElectroAI" : "Bạn"}
                    </div>
                    
                    <div className="text-[16px] leading-relaxed text-zinc-800 dark:text-zinc-200 whitespace-pre-line">
                      {msg.content}
                    </div>

                    {/* Dynamic Suggested Products Grid */}
                    {msg.products && msg.products.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        {msg.products.map((prod) => (
                          <div 
                            key={prod.id} 
                            className="flex flex-col border border-black dark:border-zinc-800 bg-[#F2F2F2] dark:bg-zinc-900 group hover:opacity-95 transition-opacity"
                          >
                            <div className="relative w-full aspect-[4/3] bg-white dark:bg-zinc-800 flex items-center justify-center p-4 border-b border-black dark:border-zinc-800">
                              <img 
                                src={prod.imageUrl} 
                                alt={prod.name}
                                className="h-full object-contain p-2 group-hover:scale-102 transition-transform duration-300"
                              />
                            </div>
                            <div className="p-4 flex flex-col justify-between flex-1 space-y-3">
                              <h4 className="text-sm font-bold line-clamp-2 text-black dark:text-white leading-tight">
                                {prod.name}
                              </h4>
                              <div className="flex items-center justify-between">
                                <span className="text-md font-extrabold text-black dark:text-white">
                                  {prod.price}
                                </span>
                                <Link 
                                  href={`/product/${prod.id}`}
                                  className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-black dark:text-white hover:underline"
                                >
                                  <span>Chi tiết</span>
                                  <ChevronRight className="w-3 h-3" />
                                </Link>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {loading && (
                <div className="flex gap-4">
                  <div className="w-9 h-9 rounded-full bg-lime-400 text-black border border-black flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="text-xs font-bold text-zinc-400 uppercase tracking-wide">
                      ElectroAI đang nhập...
                    </div>
                    <div className="flex items-center gap-1.5 py-2">
                      <span className="w-2.5 h-2.5 bg-zinc-400 rounded-full animate-bounce delay-100" />
                      <span className="w-2.5 h-2.5 bg-zinc-400 rounded-full animate-bounce delay-200" />
                      <span className="w-2.5 h-2.5 bg-zinc-400 rounded-full animate-bounce delay-300" />
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Sticky Input Bar at Bottom (when chat is active) */}
        {messages.length > 0 && (
          <div className="absolute bottom-0 left-0 w-full p-4 md:p-8 bg-gradient-to-t from-white via-white/95 to-transparent dark:from-zinc-950 dark:via-zinc-950/95 z-10">
            <div className="max-w-[760px] mx-auto bg-white dark:bg-zinc-900 border border-black dark:border-zinc-800 p-3 flex items-center gap-3 shadow-xs">
              <button className="text-zinc-400 hover:text-black dark:hover:text-white p-1">
                <ImageIcon className="w-4 h-4" />
              </button>
              
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Hỏi ElectroAI thêm về sản phẩm..."
                rows={1}
                className="flex-1 bg-transparent border-none outline-hidden resize-none text-[15px] placeholder-zinc-400 max-h-[120px]"
              />

              <button 
                onClick={() => handleSend(input)}
                disabled={!input.trim()}
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                  input.trim() 
                    ? "bg-black text-white dark:bg-white dark:text-black cursor-pointer hover:bg-lime-400 hover:text-black" 
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-300 dark:text-zinc-600"
                }`}
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
