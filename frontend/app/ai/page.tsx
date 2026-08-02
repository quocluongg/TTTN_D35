"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
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
  ChevronRight,
  ShoppingCart,
  ShoppingBag,
  Star,
  X,
  CheckCircle2,
  Zap,
  ExternalLink,
  Cpu,
  RefreshCw
} from "lucide-react";

export interface AIProduct {
  id: string | number;
  name: string;
  price: number | string;
  brand?: string;
  category?: string;
  rating?: number;
  reviews_count?: number;
  image_url?: string;
  imageUrl?: string;
  specifications?: Record<string, any> | string;
  description?: string;
  use_case?: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  products?: AIProduct[];
  intent?: string;
  confidence?: number;
  timestamp: string;
}

export default function AIChatPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiConnected, setApiConnected] = useState<boolean | null>(null);
  
  // Modal & Toast states for "Mua ngay"
  const [quickBuyProduct, setQuickBuyProduct] = useState<AIProduct | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [chatHistory, setChatHistory] = useState<Array<{ id: string; title: string }>>([
    { id: "h1", title: "Tìm laptop chơi game tầm 25 triệu" },
    { id: "h2", title: "So sánh iPhone 15 Pro và 16 Pro" },
    { id: "h3", title: "Tai nghe Bluetooth chống ồn làm việc" },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check AI engine backend connectivity
  useEffect(() => {
    fetch("http://localhost:8000/health")
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "healthy") setApiConnected(true);
        else setApiConnected(false);
      })
      .catch(() => setApiConnected(false));
  }, []);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Toast auto-hide
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const suggestions = [
    { text: "🎮 LAPTOP GAMING 25-30 TRIỆU", query: "Tư vấn cho mình một vài mẫu laptop chơi game tầm giá 25-30 triệu tốt nhất hiện nay." },
    { text: "📸 ĐIỆN THOẠI CHỤP ẢNH ĐẸP", query: "Mình muốn tìm điện thoại chụp ảnh đẹp sắc nét để đi du lịch." },
    { text: "⌨️ BÀN PHÍM & PHỤ KIỆN VĂN PHÒNG", query: "Gợi ý cho mình bàn phím hoặc chuột công thái học làm việc tầm giá dưới 1 triệu." },
    { text: "💻 ULTRABOOK MỎNG NHẸ PIN TRÂU", query: "Tìm ultrabook mỏng nhẹ, pin trâu cho học sinh sinh viên học tập văn phòng." },
    { text: "📱 SO SÁNH IPHONE 15 VÀ 16", query: "So sánh cấu hình và camera giữa iPhone 15 Pro và iPhone 16 Pro." },
  ];

  // Helper to format price in VND
  const formatPrice = (price?: number | string): string => {
    if (price === undefined || price === null) return "Liên hệ báo giá";
    if (typeof price === "number") {
      return price > 0 ? price.toLocaleString("vi-VN") + " VNĐ" : "Liên hệ báo giá";
    }
    if (!price) return "Liên hệ báo giá";
    if (price.toString().includes("đ") || price.toString().includes("VNĐ")) return price.toString();
    const num = parseFloat(price.toString().replace(/[^0-9.]/g, ""));
    return isNaN(num) || num === 0 ? "Liên hệ báo giá" : num.toLocaleString("vi-VN") + " VNĐ";
  };

  // Helper for image fallback
  const getImageUrl = (prod: AIProduct) => {
    const url = prod.image_url || prod.imageUrl;
    if (url && typeof url === "string" && (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/"))) {
      if (!url.includes("no_selection") && !url.includes("undefined")) {
        return url;
      }
    }
    return "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80";
  };

  // Extract specs badges
  const getSpecBadges = (prod: AIProduct): string[] => {
    const badges: string[] = [];
    if (prod.brand) badges.push(prod.brand);
    if (prod.category) badges.push(prod.category);
    if (prod.use_case) badges.push(prod.use_case);

    if (prod.specifications) {
      if (typeof prod.specifications === "object") {
        Object.values(prod.specifications).forEach((v) => {
          if (v && typeof v === "string" && badges.length < 4) {
            badges.push(v);
          }
        });
      } else if (typeof prod.specifications === "string") {
        badges.push(prod.specifications.slice(0, 25));
      }
    }
    return badges.slice(0, 3);
  };

  // Fallback tech store mock response generator if AI backend is offline
  const generateFallbackResponse = (queryText: string): { content: string; products: AIProduct[] } => {
    const q = queryText.toLowerCase();
    let content = `Dạ, SHOPWISE AI Assistant đã phân tích yêu cầu "${queryText}". Dưới đây là các sản phẩm phù hợp nhất tại cửa hàng:`;
    let products: AIProduct[] = [];

    if (q.includes("laptop") || q.includes("game") || q.includes("máy tính") || q.includes("gaming")) {
      content = "Dạ, dựa trên nhu cầu tìm kiếm máy tính/laptop của bạn, SHOPWISE AI gợi ý các dòng máy tính xách tay cấu hình cao, tản nhiệt tốt, bảo hành chính hãng 24 tháng:";
      products = [
        {
          id: "2",
          name: "Laptop Acer Aspire 5 Vero AV15-51-58HB (Core i5/RAM 16GB/SSD 512GB)",
          price: 15990000,
          brand: "Acer",
          category: "Laptop",
          rating: 4.8,
          reviews_count: 32,
          use_case: "Học tập - Văn phòng",
          image_url: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=600&q=80",
          specifications: { CPU: "Intel Core i5", RAM: "16GB", Storage: "512GB SSD" }
        },
        {
          id: "36",
          name: "Laptop ASUS ROG Strix G16 RTX 4060 (Core i7-13650HX/16GB/512GB)",
          price: 32990000,
          brand: "ASUS",
          category: "Laptop Gaming",
          rating: 4.9,
          reviews_count: 58,
          use_case: "Gaming",
          image_url: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=600&q=80",
          specifications: { GPU: "RTX 4060 8GB", RAM: "16GB DDR5", Screen: "165Hz" }
        },
        {
          id: "40",
          name: "MacBook Air M2 13.6 inch (8GB RAM / 256GB SSD)",
          price: 24490000,
          brand: "Apple",
          category: "MacBook",
          rating: 4.9,
          reviews_count: 120,
          use_case: "Đồ họa - Sang trọng",
          image_url: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80",
          specifications: { Chip: "Apple M2", RAM: "8GB", Display: "Retina 13.6\"" }
        }
      ];
    } else if (q.includes("iphone") || q.includes("điện thoại") || q.includes("ảnh") || q.includes("chụp") || q.includes("phone")) {
      content = "Đối với nhu cầu điện thoại thông minh chụp ảnh đẹp sắc nét, thiết kế thời thượng và hiệu năng đỉnh cao, bạn không nên bỏ qua các siêu phẩm sau:";
      products = [
        {
          id: "101",
          name: "Apple iPhone 15 Pro Max 256GB Titan Tự Nhiên",
          price: 29490000,
          brand: "Apple",
          category: "Điện thoại",
          rating: 5.0,
          reviews_count: 210,
          use_case: "Chụp ảnh Pro",
          image_url: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=600&q=80",
          specifications: { Chip: "A17 Pro", Camera: "48MP Zoom 5x", Frame: "Titanium" }
        },
        {
          id: "102",
          name: "Samsung Galaxy S24 Ultra 5G 12GB/256GB AI Camera",
          price: 27990000,
          brand: "Samsung",
          category: "Điện thoại",
          rating: 4.8,
          reviews_count: 95,
          use_case: "AI Flagship",
          image_url: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=600&q=80",
          specifications: { Chip: "Snapdragon 8 Gen 3", Camera: "200MP", Pen: "S-Pen" }
        }
      ];
    } else {
      content = "SHOPWISE AI đề xuất cho bạn các sản phẩm công nghệ hot nhất, đang có ưu đãi giảm giá tốt trong tuần này:";
      products = [
        {
          id: "8",
          name: "Tai nghe Bluetooth Gaming Baseus AeQur GH02 Chống ồn",
          price: 890000,
          brand: "Baseus",
          category: "Phụ kiện",
          rating: 4.7,
          reviews_count: 45,
          use_case: "Âm thanh Gaming",
          image_url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80",
          specifications: { Battery: "40 giờ", Latency: "20ms", Mic: "Hỗ trợ AI Noise Cancelling" }
        },
        {
          id: "12",
          name: "Bàn phím cơ Không dây Keychron K2 Pro QMK/VIA Sw Gateron Pro",
          price: 2190000,
          brand: "Keychron",
          category: "Bàn phím",
          rating: 4.9,
          reviews_count: 88,
          use_case: "Lập trình & Văn phòng",
          image_url: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80",
          specifications: { Keycaps: "PBT Double-shot", Layout: "75%", Connectivity: "Bluetooth 5.1/Type-C" }
        }
      ];
    }

    return { content, products };
  };

  // Main Handle Send Query
  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      // Call FastAPI AI Engine backend
      const res = await fetch(`http://localhost:8000/api/v1/chat?q=${encodeURIComponent(textToSend)}&top_k=5`);
      
      if (res.ok) {
        const data = await res.json();
        setApiConnected(true);

        // Extract products from retrieved or recommended list
        const rawProducts = data.retrieved_products || data.recommended_products || [];
        const formattedProducts: AIProduct[] = rawProducts.map((p: any) => ({
          id: p.id || Math.random().toString(),
          name: p.name || "Sản phẩm công nghệ",
          price: p.price || 0,
          brand: p.brand || "",
          category: p.category || "",
          rating: p.rating || 4.8,
          reviews_count: p.reviews_count || 20,
          image_url: p.image_url || p.imageUrl || p.thumbnail,
          specifications: p.specifications || p.specs || p.description,
          use_case: p.use_case || ""
        }));

        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.answer || "Dạ, tôi đã tìm thấy các sản phẩm phù hợp nhất cho bạn:",
          products: formattedProducts,
          intent: data.intent,
          confidence: data.confidence,
          timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
        };

        setMessages((prev) => [...prev, aiMsg]);
      } else {
        throw new Error("API error response");
      }
    } catch (err) {
      console.warn("AI Backend unreachable or error, using smart fallback:", err);
      setApiConnected(false);
      
      // Fallback generator
      const fallback = generateFallbackResponse(textToSend);
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: fallback.content,
        products: fallback.products,
        timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } finally {
      setLoading(false);
      // Add title to history if first message
      if (messages.length === 0) {
        const title = textToSend.length > 28 ? textToSend.substring(0, 28) + "..." : textToSend;
        setChatHistory((prev) => [{ id: Date.now().toString(), title }, ...prev]);
      }
    }
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

  // Direct "Mua ngay" trigger action
  const handleQuickBuy = (product: AIProduct, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setQuickBuyProduct(product);
    setQuantity(1);
    setToastMessage(`🛒 Đã thêm "${product.name}" vào giỏ hàng thành công!`);
  };

  // Helper renderer for Markdown-like text
  const renderFormattedContent = (content: string) => {
    const lines = content.split("\n");
    return lines.map((line, idx) => {
      // Format bold text **text**
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const formattedLine = parts.map((part, pIdx) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={pIdx} className="font-bold text-black dark:text-white">{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      return (
        <React.Fragment key={idx}>
          {line.trim().startsWith("•") || line.trim().startsWith("1️⃣") || line.trim().startsWith("2️⃣") || line.trim().startsWith("👉") ? (
            <div className="my-1 pl-2 font-medium">{formattedLine}</div>
          ) : (
            <p className="my-1">{formattedLine}</p>
          )}
        </React.Fragment>
      );
    });
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950 text-black dark:text-white transition-colors duration-300">
      
      {/* FLOATING TOAST ALERT */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 bg-black text-white dark:bg-white dark:text-black shadow-2xl border border-lime-400 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="w-5 h-5 text-lime-400 shrink-0" />
          <span className="text-sm font-semibold">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* QUICK BUY MODAL */}
      {quickBuyProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-black dark:border-zinc-800 w-full max-w-lg p-6 shadow-2xl space-y-6 relative">
            <button 
              onClick={() => setQuickBuyProduct(null)} 
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-black dark:hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-xs font-bold text-lime-600 dark:text-lime-400 uppercase tracking-widest">
              <ShoppingBag className="w-4 h-4" />
              <span>Xác nhận mua ngay sản phẩm</span>
            </div>

            <div className="flex gap-4 items-start border-y border-black/10 dark:border-zinc-800 py-4">
              <div className="w-24 h-24 bg-white dark:bg-zinc-800 border border-black/10 dark:border-zinc-700 p-2 shrink-0 flex items-center justify-center">
                <img 
                  src={getImageUrl(quickBuyProduct)} 
                  alt={quickBuyProduct.name}
                  className="max-h-full max-w-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLElement).setAttribute("src", "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80");
                  }}
                />
              </div>

              <div className="flex-1 space-y-2">
                <h3 className="text-base font-bold text-black dark:text-white line-clamp-2">
                  {quickBuyProduct.name}
                </h3>
                {quickBuyProduct.brand && (
                  <span className="inline-block px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-[11px] font-bold uppercase tracking-wider">
                    {quickBuyProduct.brand}
                  </span>
                )}
                <div className="text-lg font-black text-black dark:text-white">
                  {formatPrice(quickBuyProduct.price)}
                </div>
              </div>
            </div>

            {/* Quantity Control */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold">Số lượng đặt mua:</span>
              <div className="flex items-center border border-black dark:border-zinc-700">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-9 h-9 flex items-center justify-center text-lg font-bold hover:bg-black/5 dark:hover:bg-white/5"
                >
                  -
                </button>
                <span className="w-12 text-center font-bold text-sm">{quantity}</span>
                <button 
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-9 h-9 flex items-center justify-center text-lg font-bold hover:bg-black/5 dark:hover:bg-white/5"
                >
                  +
                </button>
              </div>
            </div>

            {/* Price Total */}
            <div className="flex items-center justify-between p-3 bg-zinc-100 dark:bg-zinc-800/80 font-bold text-sm">
              <span>Tổng tiền thanh toán:</span>
              <span className="text-base text-black dark:text-white font-black">
                {typeof quickBuyProduct.price === "number"
                  ? formatPrice(quickBuyProduct.price * quantity)
                  : formatPrice(quickBuyProduct.price)}
              </span>
            </div>

            {/* Modal Actions */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button 
                onClick={() => setQuickBuyProduct(null)}
                className="py-3 px-4 border border-black dark:border-zinc-700 font-bold text-xs uppercase tracking-wider hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                Đóng
              </button>
              <Link
                href="/checkout"
                onClick={() => setQuickBuyProduct(null)}
                className="py-3 px-4 bg-black text-white dark:bg-white dark:text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-lime-400 hover:text-black dark:hover:bg-lime-400 dark:hover:text-black transition-colors"
              >
                <span>Thanh toán ngay</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* SIDEBAR */}
      <aside className="w-[280px] border-r border-black/10 dark:border-zinc-800 bg-[#F2F2F2] dark:bg-zinc-900/50 flex flex-col justify-between h-full shrink-0 hidden md:flex">
        <div className="flex flex-col p-4 space-y-6 overflow-y-auto">
          {/* Header & Back Link */}
          <div className="flex items-center justify-between pb-2 border-b border-black/10 dark:border-zinc-800">
            <Link href="/shop" className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider hover:opacity-75">
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại Cửa hàng</span>
            </Link>
            <Sparkles className="w-5 h-5 text-lime-500 fill-lime-500/20" />
          </div>

          {/* New Chat Button */}
          <button 
            onClick={startNewChat}
            className="flex items-center justify-between px-4 py-3 bg-white dark:bg-zinc-800 border border-black dark:border-zinc-700 text-xs font-bold uppercase tracking-wider hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all duration-200 cursor-pointer shadow-xs"
          >
            <span>Đoạn chat mới</span>
            <Plus className="w-4 h-4" />
          </button>

          {/* Search History */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Tìm đoạn chat cũ..." 
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-zinc-800 border border-black/10 dark:border-zinc-700 text-xs focus:outline-hidden placeholder-zinc-400"
            />
          </div>

          {/* History List */}
          <div className="space-y-3">
            <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
              Lịch sử tư vấn
            </div>
            
            <div className="space-y-1">
              {chatHistory.map((item) => (
                <div 
                  key={item.id}
                  onClick={() => handleSend(item.title)}
                  className="group flex items-center justify-between px-3 py-2.5 hover:bg-black/5 dark:hover:bg-white/5 text-xs font-semibold cursor-pointer transition-colors border border-transparent hover:border-black/10"
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

        {/* System Status Footer */}
        <div className="p-4 border-t border-black/10 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-black text-white dark:bg-white dark:text-black flex items-center justify-center font-bold text-xs">
              AI
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold leading-tight">SHOPWISE RAG Engine</span>
              <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${apiConnected ? "bg-emerald-500" : "bg-amber-500"}`} />
                {apiConnected ? "Live FastAPI Online" : "Grounded Fallback Mode"}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CHAT AREA */}
      <main className="flex-1 flex flex-col h-full relative">
        {/* Header */}
        <header className="h-[60px] border-b border-black/15 dark:border-zinc-800 flex items-center justify-between px-4 md:px-8 bg-white dark:bg-zinc-950 z-10 shrink-0">
          <div className="flex items-center gap-3">
            <Link href="/shop" className="md:hidden p-2 -ml-2 text-zinc-600 dark:text-zinc-300">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-lime-400 text-black border border-black flex items-center justify-center font-black">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-base md:text-lg font-bold leading-none">SHOPWISE AI Assistant</h1>
                <p className="text-[11px] text-zinc-500 hidden sm:block">PhoBERT Vietnamese NLU • 4-Stage Search • RAG Guardrails</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-zinc-100 dark:bg-zinc-900 border border-black/10 text-[11px] font-bold">
              <span className={`w-2 h-2 rounded-full animate-pulse ${apiConnected ? "bg-emerald-500" : "bg-amber-500"}`} />
              <span>{apiConnected ? "Backend Online" : "Offline Fallback"}</span>
            </div>
            
            <button 
              onClick={startNewChat}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-black dark:border-zinc-700 text-xs font-bold bg-white text-black dark:bg-zinc-900 dark:text-white hover:bg-black hover:text-white transition-colors"
            >
              <span>Xóa chat</span>
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 bg-[#FDFDFD] dark:bg-zinc-950/20">
          {messages.length === 0 ? (
            /* LANDING / WELCOME SCREEN */
            <div className="max-w-[760px] mx-auto pt-[6vh] flex flex-col items-center justify-center text-center space-y-10">
              
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-black text-white dark:bg-white dark:text-black text-xs font-bold uppercase tracking-widest">
                  <Sparkles className="w-3.5 h-3.5 text-lime-400 fill-lime-400/20" />
                  <span>Trợ lý tư vấn E-Commerce thông minh</span>
                </div>
                <h2 className="text-[28px] sm:text-[40px] md:text-[48px] font-black tracking-tight leading-tight">
                  Bạn cần mua gì hôm nay?<br />Hãy để SHOPWISE AI tư vấn.
                </h2>
                <p className="text-sm text-zinc-500 max-w-lg mx-auto">
                  Tự động phân tích nhu cầu, so sánh thông số kỹ thuật, gợi ý sản phẩm phù hợp theo giá tiền và hỗ trợ đặt hàng ngay!
                </p>
              </div>

              {/* Central Input Box */}
              <div className="w-full bg-white dark:bg-zinc-900 border-2 border-black dark:border-zinc-800 p-4 shadow-lg space-y-3 relative focus-within:border-lime-500 dark:focus-within:border-lime-400 transition-colors">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Tôi muốn tìm một chiếc laptop gaming tầm 25 triệu, RAM 16GB, RTX 4060..."
                  className="w-full min-h-[90px] bg-transparent border-none outline-hidden resize-none text-[15px] sm:text-[16px] text-black dark:text-white placeholder-zinc-400"
                />
                
                <div className="flex items-center justify-between pt-3 border-t border-black/10 dark:border-zinc-800">
                  <div className="flex items-center gap-3 text-zinc-400">
                    <button className="hover:text-black dark:hover:text-white transition-colors p-1">
                      <ImageIcon className="w-4 h-4" />
                    </button>
                    <button className="hover:text-black dark:hover:text-white transition-colors p-1">
                      <Paperclip className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <button 
                    onClick={() => handleSend(input)}
                    disabled={!input.trim()}
                    className={`px-5 py-2.5 font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all ${
                      input.trim() 
                        ? "bg-black text-white dark:bg-white dark:text-black cursor-pointer hover:bg-lime-400 hover:text-black dark:hover:bg-lime-400 dark:hover:text-black" 
                        : "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed"
                    }`}
                  >
                    <span>Gửi yêu cầu</span>
                    <ArrowUp className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Suggestions Grid */}
              <div className="w-full space-y-3 pt-2">
                <div className="text-xs uppercase font-bold text-zinc-400 tracking-widest">
                  Gợi ý câu hỏi phổ biến
                </div>
                
                <div className="flex flex-wrap justify-center gap-2.5 max-w-[700px] mx-auto">
                  {suggestions.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(item.query)}
                      className="px-4 py-2 border border-black/20 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-bold hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all cursor-pointer shadow-2xs"
                    >
                      {item.text}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          ) : (
            /* ACTIVE CHAT MESSAGES LOG */
            <div className="max-w-[840px] mx-auto space-y-8 pb-36">
              {messages.map((msg) => (
                <div key={msg.id} className="flex gap-3 sm:gap-4 items-start">
                  {/* Avatar */}
                  <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shrink-0 border border-black ${
                    msg.role === "assistant" 
                      ? "bg-lime-400 text-black font-black" 
                      : "bg-black text-white dark:bg-white dark:text-black font-bold"
                  }`}>
                    {msg.role === "assistant" ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>

                  {/* Content Bubble */}
                  <div className="flex-1 space-y-3 overflow-hidden">
                    <div className="flex items-center justify-between text-xs font-bold text-zinc-400 uppercase tracking-wider">
                      <span>{msg.role === "assistant" ? "SHOPWISE AI Assistant" : "Bạn"}</span>
                      <span className="text-[10px] text-zinc-400">{msg.timestamp}</span>
                    </div>
                    
                    <div className="text-[15px] leading-relaxed text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900 p-4 border border-black/10 dark:border-zinc-800 shadow-2xs">
                      {renderFormattedContent(msg.content)}
                    </div>

                    {/* RESPONSIVE PRODUCT CARDS LIST */}
                    {msg.products && msg.products.length > 0 && (
                      <div className="space-y-3 pt-3">
                        <div className="flex items-center justify-between px-1">
                          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-black dark:text-white">
                            <ShoppingBag className="w-4 h-4 text-lime-500" />
                            <span>Danh sách sản phẩm được đề xuất ({msg.products.length})</span>
                          </div>
                          <span className="text-[11px] text-zinc-500 font-semibold hidden sm:inline">Vuốt hoặc cuộn để xem thêm</span>
                        </div>

                        {/* RESPONSIVE CARDS GRID / TOUCH CAROUSEL */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                          {msg.products.map((prod) => (
                            <div 
                              key={prod.id} 
                              className="flex flex-col border-2 border-black dark:border-zinc-800 bg-white dark:bg-zinc-900 group hover:shadow-xl transition-all duration-300 relative"
                            >
                              {/* Top Rating & Brand Header */}
                              <div className="flex items-center justify-between p-3 border-b border-black/10 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                                {prod.brand ? (
                                  <span className="px-2 py-0.5 bg-black text-white dark:bg-white dark:text-black text-[10px] font-black uppercase tracking-wider">
                                    {prod.brand}
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 bg-lime-400 text-black text-[10px] font-black uppercase tracking-wider">
                                    SHOPWISE Gợi Ý
                                  </span>
                                )}

                                <div className="flex items-center gap-1 text-[11px] font-bold text-amber-500">
                                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                  <span>{prod.rating || 4.8}</span>
                                  <span className="text-zinc-400 text-[10px]">({prod.reviews_count || 25})</span>
                                </div>
                              </div>

                              {/* Product Thumbnail */}
                              <div className="relative w-full aspect-[4/3] bg-white dark:bg-zinc-950 p-4 border-b border-black/10 dark:border-zinc-800 flex items-center justify-center overflow-hidden">
                                <img 
                                  src={getImageUrl(prod)} 
                                  alt={prod.name}
                                  className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                                  onError={(e) => {
                                    (e.target as HTMLElement).setAttribute("src", "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80");
                                  }}
                                />
                              </div>

                              {/* Card Content */}
                              <div className="p-4 flex flex-col justify-between flex-1 space-y-4">
                                <div className="space-y-2">
                                  <h4 className="text-sm font-extrabold line-clamp-2 text-black dark:text-white leading-snug group-hover:text-lime-600 dark:group-hover:text-lime-400 transition-colors">
                                    {prod.name}
                                  </h4>

                                  {/* Badges / Specs */}
                                  <div className="flex flex-wrap gap-1 pt-1">
                                    {getSpecBadges(prod).map((b, bIdx) => (
                                      <span key={bIdx} className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 border border-black/10 text-[10px] font-bold text-zinc-600 dark:text-zinc-300 truncate max-w-[130px]">
                                        {b}
                                      </span>
                                    ))}
                                  </div>
                                </div>

                                {/* Price & CTA Action Buttons */}
                                <div className="space-y-3 pt-2 border-t border-black/10 dark:border-zinc-800">
                                  <div className="flex items-baseline justify-between">
                                    <span className="text-[10px] font-bold text-zinc-400 uppercase">Giá ưu đãi:</span>
                                    <span className="text-base font-black text-black dark:text-white tracking-tight">
                                      {formatPrice(prod.price)}
                                    </span>
                                  </div>

                                  {/* MUA NGAY & CHI TIẾT BUTTONS */}
                                  <div className="grid grid-cols-2 gap-2">
                                    <button
                                      onClick={(e) => handleQuickBuy(prod, e)}
                                      className="py-2.5 px-3 bg-black text-white dark:bg-white dark:text-black text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 hover:bg-lime-400 hover:text-black dark:hover:bg-lime-400 dark:hover:text-black transition-all cursor-pointer shadow-xs"
                                    >
                                      <ShoppingCart className="w-3.5 h-3.5" />
                                      <span>Mua ngay</span>
                                    </button>

                                    <Link 
                                      href={`/product/${prod.id}`}
                                      className="py-2.5 px-3 border border-black dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1 text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all"
                                    >
                                      <span>Chi tiết</span>
                                      <ExternalLink className="w-3 h-3" />
                                    </Link>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {loading && (
                <div className="flex gap-3 sm:gap-4 items-center">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-lime-400 text-black border border-black flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-white dark:bg-zinc-900 border border-black/10 dark:border-zinc-800 px-4 py-3 flex items-center gap-3">
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">SHOPWISE AI đang phân tích & truy xuất sản phẩm...</span>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 bg-lime-500 rounded-full animate-bounce delay-100" />
                      <span className="w-2 h-2 bg-lime-500 rounded-full animate-bounce delay-200" />
                      <span className="w-2 h-2 bg-lime-500 rounded-full animate-bounce delay-300" />
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
          <div className="absolute bottom-0 left-0 w-full p-4 md:p-6 bg-gradient-to-t from-zinc-50 via-zinc-50/95 to-transparent dark:from-zinc-950 dark:via-zinc-950/95 z-10">
            <div className="max-w-[840px] mx-auto bg-white dark:bg-zinc-900 border-2 border-black dark:border-zinc-800 p-2.5 flex items-center gap-3 shadow-xl">
              <button className="text-zinc-400 hover:text-black dark:hover:text-white p-1 ml-1">
                <ImageIcon className="w-4 h-4" />
              </button>
              
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Hỏi SHOPWISE AI thêm về sản phẩm, khoảng giá, khuyến mãi..."
                rows={1}
                className="flex-1 bg-transparent border-none outline-hidden resize-none text-[15px] placeholder-zinc-400 max-h-[120px]"
              />

              <button 
                onClick={() => handleSend(input)}
                disabled={!input.trim()}
                className={`p-2.5 flex items-center justify-center shrink-0 transition-colors font-bold text-xs uppercase ${
                  input.trim() 
                    ? "bg-black text-white dark:bg-white dark:text-black cursor-pointer hover:bg-lime-400 hover:text-black" 
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed"
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
