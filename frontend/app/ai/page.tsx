"use client";

import React, { useState, useEffect, useRef } from "react";
import PublicLayout from "@/shared/layouts/PublicLayout";
import { ThinkingOrb } from "thinking-orbs";
import MarkdownText from "@/components/ui/MarkdownText";
import { productService, ProductListItem, ProductDetail } from "@/services/productServices";
import { useCurrentUser } from "@/hooks/useAuth";
import { cartService } from "@/services/cartService";
import { notifyError, notifySuccess } from "@/components/Notify";
import {
  Search,
  ArrowUp,
  MessageSquare,
  Trash2,
  Loader2,
  AlertCircle,
  X,
  Image as ImageIcon,
  Sparkles,
  Sliders,
  Edit3,
  ArrowRight,
  Star,
  ShoppingBag,
} from "lucide-react";

const AI_API_URL = process.env.NEXT_PUBLIC_AI_API_URL || "http://localhost:8000";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  confidence?: number;
  sources?: Array<{ id: string; text: string; score: number }>;
  realProducts?: ProductListItem[];
  created_at?: string;
}

interface Conversation {
  id: string;
  title: string;
  status: string;
  started_at: string;
  message_count: number;
  last_message?: string;
}

const slugify = (text?: string) => {
  if (!text || typeof text !== "string") return "";
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
};

/**
 * Extract product ID from chunk ID.
 * Chunk ID format: {product_id}_{chunk_type}_{index}
 * Example: 46d32c37-617b-406d-8323-aad467ed709b_description_0
 */
const extractProductId = (chunkId?: string): string => {
  if (!chunkId || typeof chunkId !== "string") return "";
  // Match UUID pattern at the beginning
  const uuidMatch = chunkId.match(/^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
  if (uuidMatch) {
    return uuidMatch[1];
  }
  // Fallback: try to extract by removing known suffixes
  const suffixes = ["_description_", "_spec_", "_faq_", "_policy_"];
  for (const suffix of suffixes) {
    const idx = chunkId.indexOf(suffix);
    if (idx > 0) {
      return chunkId.substring(0, idx);
    }
  }
  // If no pattern matches, return as-is
  return chunkId;
};

const getRefProductImage = (text?: string) => {
  const lower = (text || "").toLowerCase();
  if (lower.includes("iphone") || lower.includes("samsung") || lower.includes("điện thoại") || lower.includes("phone")) {
    return "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&q=80";
  }
  if (lower.includes("macbook") || lower.includes("apple")) {
    return "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300&q=80";
  }
  if (lower.includes("asus") || lower.includes("vivobook") || lower.includes("msi") || lower.includes("laptop")) {
    return "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=300&q=80";
  }
  return "https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=300&q=80";
};

const formatThumbnailUrl = (thumbnail?: string, name?: string) => {
  if (!thumbnail) return getRefProductImage(name || "");
  if (thumbnail.startsWith("http://") || thumbnail.startsWith("https://") || thumbnail.startsWith("data:")) {
    return thumbnail;
  }
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  return `${apiBase}${thumbnail.startsWith("/") ? "" : "/"}${thumbnail}`;
};

const parseProductFromSource = (text?: string, id?: string) => {
  const safeText = typeof text === "string" ? text : "";
  const cleanText = safeText.replace(/^Sản phẩm\s+/i, "");
  const lower = cleanText.toLowerCase();

  let brand = "SHOPWISE";
  let name = cleanText.split(" - ")[0] || cleanText || "Sản phẩm gợi ý";
  let price = "Liên hệ";
  let originalPrice = "";
  let rating = 4.8;
  let specs: string[] = ["Chính hãng 100%", "Bảo hành 24 tháng"];
  let image = getRefProductImage(cleanText);

  if (lower.includes("msi") || lower.includes("cyborg")) {
    brand = "MSI";
    name = "Laptop Gaming MSI Cyborg 15 A13UC-2082VN";
    price = "23.990.000đ";
    originalPrice = "25.990.000đ";
    rating = 4.9;
    specs = ["Core i5-13420H", "RTX 3050 4GB", "RAM 16GB", "SSD 512GB"];
  } else if (lower.includes("hp")) {
    brand = "HP";
    name = "Laptop HP 250 G10 073TQAT";
    price = "14.490.000đ";
    originalPrice = "16.290.000đ";
    rating = 4.7;
    specs = ["Intel Core i5-1335U", "RAM 8GB", "SSD 512GB", "15.6\" FHD"];
  } else if (lower.includes("macbook") || lower.includes("apple")) {
    brand = "APPLE";
    name = "MacBook Air 15 inch M2 2023";
    price = "31.990.000đ";
    originalPrice = "34.990.000đ";
    rating = 5.0;
    specs = ["Apple M2 Chip", "RAM 8GB", "SSD 256GB", "Liquid Retina"];
  } else if (lower.includes("iphone") || lower.includes("samsung") || lower.includes("phone")) {
    brand = lower.includes("samsung") ? "SAMSUNG" : "APPLE";
    name = lower.includes("samsung") ? "Samsung Galaxy S24 Ultra 5G" : "iPhone 15 Pro Max 256GB";
    price = lower.includes("samsung") ? "29.990.000đ" : "32.490.000đ";
    originalPrice = lower.includes("samsung") ? "33.990.000đ" : "34.990.000đ";
    rating = 4.9;
    specs = ["Chip flagship 4nm", "Camera 200MP / 48MP", "Pin 5000mAh"];
  } else {
    const firstWord = name.split(" ")[0];
    if (firstWord && firstWord.length > 1) {
      brand = firstWord.toUpperCase();
    }
  }

  let category = lower.includes("iphone") || lower.includes("samsung") || lower.includes("phone") ? "SMARTPHONE" : "LAPTOP";

  const slug = id && id.length > 5 ? id : slugify(name);

  return { brand, name, category, price, originalPrice, rating, specs, image, slug };
};

function ProductThumbnail({ src, brand }: { src: string; brand?: string }) {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setImgSrc(src);
    setHasError(false);
  }, [src]);

  const defaultFallback = "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300&q=80";

  return (
    <div className="relative w-full sm:w-24 h-24 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-100 dark:border-zinc-800 p-1.5 flex items-center justify-center shrink-0 overflow-hidden select-none">
      {!hasError ? (
        <img
          src={imgSrc}
          alt=""
          onError={() => {
            if (imgSrc !== defaultFallback) {
              setImgSrc(defaultFallback);
            } else {
              setHasError(true);
            }
          }}
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-400">
          <ImageIcon size={22} />
        </div>
      )}

      {brand && (
        <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/80 dark:bg-white/90 text-white dark:text-black text-[9px] font-extrabold uppercase rounded tracking-wider z-10">
          {brand}
        </span>
      )}
    </div>
  );
}

function RefProductCard({ source }: { source?: { id?: string; text?: string; score?: number } }) {
  const [product, setProduct] = useState<ProductDetail | null>(null);

  const rawText = typeof source?.text === "string" ? source.text : "";
  const cleanTitle = rawText ? (rawText.replace(/^Sản phẩm\s+/i, "").split(" - ")[0] || rawText) : "";
  const fallbackSlug = slugify(cleanTitle);

  // Extract actual product ID from chunk ID (format: {product_id}_{chunk_type}_{index})
  const productId = extractProductId(source?.id);

  useEffect(() => {
    let isMounted = true;
    const fetchDetail = async () => {
      try {
        const targetId = productId && productId.length > 5 ? productId : fallbackSlug;
        if (!targetId) return;
        const res = await productService.getProductBySlugOrId(targetId);
        if (isMounted && res.success && res.data) {
          setProduct(res.data);
        }
      } catch (err) {
        // Soft fail to fallback info
      }
    };

    fetchDetail();
    return () => {
      isMounted = false;
    };
  }, [productId, fallbackSlug]);

  const fallbackInfo = parseProductFromSource(rawText, productId);

  const name = product?.name || fallbackInfo.name;
  const brand = product?.brand || fallbackInfo.brand;
  const slug = product?.slug || product?.id || fallbackInfo.slug;
  const rating = product?.ratingAvg ? product.ratingAvg.toFixed(1) : fallbackInfo.rating;

  let priceStr = fallbackInfo.price;
  if (product?.variants && product.variants.length > 0) {
    const minPrice = Math.min(...product.variants.map((v) => v.price));
    priceStr = new Intl.NumberFormat("vi-VN").format(minPrice) + "đ";
  }

  const thumbnail = formatThumbnailUrl(product?.thumbnail, name);
  const reviewCount = product?.reviewCount || 45;
  const categoryName = product?.categoryBreadcrumb?.[0]?.name || fallbackInfo.category || "LAPTOP";

  const specs = [
    product?.origin ? `Xuất xứ: ${product.origin}` : fallbackInfo.specs[0] || "Chính hãng 100%",
    product?.warrantyMonths ? `Bảo hành ${product.warrantyMonths} tháng` : fallbackInfo.specs[1] || "Bảo hành 24 tháng",
  ];

  return (
    <a
      href={`/product/${slug}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col justify-between w-full max-w-[280px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl overflow-hidden shadow-2xs hover:shadow-lg transition-all duration-300 block text-inherit no-underline"
    >
      {/* Top Image Section */}
      <div className="relative w-full aspect-square bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 p-4 flex items-center justify-center overflow-hidden">
        {/* Brand Badge */}
        {brand && (
          <span className="absolute top-3 left-3 z-10 px-2 py-0.5 bg-black text-white dark:bg-white dark:text-black text-[10px] font-extrabold uppercase rounded tracking-wider">
            {brand}
          </span>
        )}

        {/* Product Image */}
        <ProductThumbnail src={thumbnail} brand="" />
      </div>

      {/* Bottom Info Section */}
      <div className="p-4 flex flex-col justify-between flex-1 gap-3 bg-white dark:bg-zinc-900">
        <div className="space-y-2">
          {/* Category & Rating */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              {categoryName}
            </span>
            <div className="flex items-center gap-1 text-[11px] font-bold text-amber-500">
              <Star size={12} className="fill-amber-400 text-amber-400" />
              <span>{rating}</span>
              <span className="text-zinc-400 font-normal">({reviewCount})</span>
            </div>
          </div>

          {/* Product Title */}
          <h3 className="text-sm font-bold text-zinc-900 dark:text-white line-clamp-2 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {name}
          </h3>
        </div>

        <div>
          {/* Divider Line */}
          <div className="border-t border-zinc-100 dark:border-zinc-800 my-2" />

          {/* Price Row */}
          <div className="flex items-baseline gap-1.5 mb-3">
            <span className="text-xs text-zinc-500 font-medium">Giá từ:</span>
            <span className="text-base font-extrabold text-blue-600 dark:text-blue-400">
              {priceStr}
            </span>
          </div>

          {/* Full Width Button */}
          <div className="w-full py-2.5 bg-black text-white dark:bg-white dark:text-black font-bold text-xs rounded-none text-center group-hover:bg-blue-600 dark:group-hover:bg-blue-500 group-hover:text-white dark:group-hover:text-white transition-colors">
            Xem chi tiết
          </div>
        </div>
      </div>
    </a>
  );
}

function RefProductCardFromItem({ product, onAddToCart }: { product: ProductListItem; onAddToCart?: (product: ProductListItem) => void }) {
  if (!product) return null;
  const slug = product.slug || product.id;
  const formattedPrice = product.priceFrom
    ? new Intl.NumberFormat("vi-VN").format(product.priceFrom) + "đ"
    : "Liên hệ";
  const thumbnail = formatThumbnailUrl(product.thumbnail, product.name);
  const rating = product.ratingAvg ? product.ratingAvg.toFixed(1) : "4.8";
  const reviewCount = product.reviewCount || 45;
  const categoryName = product.categoryName || "LAPTOP";

  return (
    <div className="group flex flex-col justify-between w-full max-w-[280px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl overflow-hidden shadow-2xs hover:shadow-lg transition-all duration-300 block text-inherit no-underline">
      {/* Top Image Section */}
      <a
        href={`/product/${slug}`}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <div className="relative w-full aspect-square bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 p-4 flex items-center justify-center overflow-hidden">
          {/* Brand Badge */}
          {product.brand && (
            <span className="absolute top-3 left-3 z-10 px-2 py-0.5 bg-black text-white dark:bg-white dark:text-black text-[10px] font-extrabold uppercase rounded tracking-wider">
              {product.brand}
            </span>
          )}

          {/* Product Image */}
          <ProductThumbnail src={thumbnail} brand="" />
        </div>
      </a>

      {/* Bottom Info Section */}
      <div className="p-4 flex flex-col justify-between flex-1 gap-3 bg-white dark:bg-zinc-900">
        <a href={`/product/${slug}`} target="_blank" rel="noopener noreferrer" className="block">
          <div className="space-y-2">
            {/* Category & Rating */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                {categoryName}
              </span>
              <div className="flex items-center gap-1 text-[11px] font-bold text-amber-500">
                <Star size={12} className="fill-amber-400 text-amber-400" />
                <span>{rating}</span>
                <span className="text-zinc-400 font-normal">({reviewCount})</span>
              </div>
            </div>

            {/* Product Title */}
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white line-clamp-2 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {product.name}
            </h3>
          </div>
        </a>

        <div>
          {/* Divider Line */}
          <div className="border-t border-zinc-100 dark:border-zinc-800 my-2" />

          {/* Price Row */}
          <div className="flex items-baseline gap-1.5 mb-3">
            <span className="text-xs text-zinc-500 font-medium">Giá từ:</span>
            <span className="text-base font-extrabold text-blue-600 dark:text-blue-400">
              {formattedPrice}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <a
              href={`/product/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white font-bold text-xs rounded-lg text-center hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors flex items-center justify-center gap-1"
            >
              Xem chi tiết
            </a>
            {onAddToCart && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onAddToCart(product);
                }}
                className="py-2.5 bg-black text-white dark:bg-white dark:text-black font-bold text-xs rounded-lg text-center group-hover:bg-blue-600 dark:group-hover:bg-blue-500 transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <ShoppingBag size={13} />
                Thêm vào giỏ
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ReferencedProducts({
  products,
  onAddToCart,
}: {
  products: ProductListItem[];
  onAddToCart?: (product: ProductListItem) => void;
}) {
  const [visible, setVisible] = useState(2);
  const canExpand = products.length > visible;
  const displayed = products.slice(0, visible);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-3">
        {displayed.map((p, i) => (
          <RefProductCardFromItem key={i} product={p} onAddToCart={onAddToCart} />
        ))}
      </div>

      {products.length > 2 && (
        <button
          onClick={() => setVisible((v) => Math.min(v + 4, products.length))}
          className="mt-3 w-full py-2 text-xs font-semibold text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/60 transition-colors"
        >
          {canExpand
            ? `Xem thêm ${Math.min(4, products.length - visible)} sản phẩm`
            : "Thu gọn"}
        </button>
      )}
    </>
  );
}

export default function AIChatPage() {
  const [mounted, setMounted] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hideLastSessionCard, setHideLastSessionCard] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Real authenticated user (fallback to guest id when not logged in)
  const { data: currentUser } = useCurrentUser();
  const userId = currentUser?.id || "guest";

  const handleAddToCart = async (product: ProductListItem) => {
    try {
      const res = await productService.getProductBySlugOrId(product.id || product.slug);
      const detail = res?.data;
      const variant = detail?.variants?.find((v) => v.stock > 0) || detail?.variants?.[0];
      if (!variant) {
        notifyError("Sản phẩm chưa có biến thể để thêm vào giỏ.");
        return;
      }
      await cartService.addItem({ variantId: variant.id, quantity: 1 });
      notifySuccess("Đã thêm sản phẩm vào giỏ hàng!");

      // Log conversion event to AI service for analytics
      const params = new URLSearchParams();
      if (currentConversation) params.append("conversation_id", currentConversation);
      params.append("user_id", userId);
      params.append("event_type", "ADD_TO_CART");
      params.append("product_id", detail?.id || product.id);
      fetch(`${AI_API_URL}/chat/conversion?${params}`, { method: "POST" }).catch(() => {});
    } catch (err: any) {
      notifyError(err?.response?.data?.message || err?.message || "Không thể thêm vào giỏ hàng!");
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  const scrollToBottom = (smooth = true) => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: smooth ? "smooth" : "auto",
      });
    }
  };

  // Auto-scroll inside chat container
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom(true);
    }
  }, [messages.length, loading]);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const res = await fetch(`${AI_API_URL}/chat/conversations?user_id=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch (err) {
      console.error("Failed to load conversations:", err);
    }
  };

  const createConversation = async () => {
    try {
      const res = await fetch(`${AI_API_URL}/chat/conversations?user_id=${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Cuộc trò chuyện mới" }),
      });

      if (res.ok) {
        const data = await res.json();
        setCurrentConversation(data.id);
        setMessages([]);
        await loadConversations();
      }
    } catch (err) {
      console.error("Failed to create conversation:", err);
    }
  };

  const loadConversation = async (id: string) => {
    try {
      const res = await fetch(`${AI_API_URL}/chat/conversations/${id}`);
      if (res.ok) {
        const data = await res.json();
        setCurrentConversation(id);
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error("Failed to load conversation:", err);
    }
  };

  const deleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Xóa cuộc trò chuyện này?")) return;

    try {
      const res = await fetch(`${AI_API_URL}/chat/conversations/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        if (currentConversation === id) {
          setCurrentConversation(null);
          setMessages([]);
        }
        await loadConversations();
      }
    } catch (err) {
      console.error("Failed to delete conversation:", err);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      // Create conversation if none selected
      let convId = currentConversation;
      if (!convId) {
        const convRes = await fetch(`${AI_API_URL}/chat/conversations?user_id=${userId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: userMessage.content.substring(0, 30) }),
        });

        if (convRes.ok) {
          const convData = await convRes.json();
          convId = convData.id;
          setCurrentConversation(convId);
          await loadConversations();
        }
      }

      // Send message
      const params = new URLSearchParams();
      if (convId) params.append("conversation_id", convId);
      params.append("user_id", userId);

      const res = await fetch(`${AI_API_URL}/chat?${params}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: userMessage.content }),
      });

      if (!res.ok) {
        throw new Error("Failed to get response");
      }

      const data = await res.json();

      // Ưu tiên dùng sản phẩm thật từ phản hồi của AI pipeline (data.products),
      // kết hợp với kết quả tìm kiếm để có đủ sản phẩm cho nút "Xem thêm".
      let realProducts: ProductListItem[] = [];
      try {
        const aiProducts: ProductListItem[] = Array.isArray(data.products)
          ? data.products.map((p: any) => ({
              id: String(p.id),
              slug: p.slug || p.id,
              name: p.name || "Sản phẩm",
              thumbnail: p.thumbnail || "",
              brand: p.brand || "",
              categoryName: p.category_name || p.category || "",
              priceFrom: p.price_from || 0,
              ratingAvg: p.rating_avg || p.rating || 4.8,
              reviewCount: p.review_count || p.reviews_count || 0,
            }))
          : [];

        const searchItems: ProductListItem[] = [];
        try {
          const prodRes = await productService.getProducts({ search: userMessage.content, size: 6 });
          const items = (prodRes?.data?.content || prodRes?.data?.items || []) as ProductListItem[];
          if (Array.isArray(items)) searchItems.push(...items);
        } catch (e) {
          console.error("Could not fetch search products:", e);
        }

        const seen = new Set<string>();
        const merged: ProductListItem[] = [];
        for (const p of [...aiProducts, ...searchItems]) {
          if (p?.id && !seen.has(p.id)) {
            seen.add(p.id);
            merged.push(p);
          }
        }
        realProducts = merged.slice(0, 6);
      } catch (e) {
        console.error("Could not build real products:", e);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
        confidence: data.confidence,
        sources: data.sources,
        realProducts,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Update conversation list
      await loadConversations();
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
      inputRef.current?.focus({ preventScroll: true });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const filteredConversations = conversations.filter((c) =>
    !searchQuery || c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const lastSession = conversations.length > 0 ? conversations[0] : null;

  const mockPreviewImages = [
    "/figma/product_1.png",
    "/figma/product_2.png",
    "/figma/product_3.png",
  ];

  const suggestions = [
    {
      text: "Tư vấn laptop gaming tầm 25 triệu cấu hình mạnh",
      query: "Tư vấn laptop gaming tầm 25 triệu cấu hình mạnh",
    },
    {
      text: "So sánh iPhone 16 Pro Max và Samsung Galaxy S24 Ultra",
      query: "So sánh iPhone 16 Pro Max và Samsung Galaxy S24 Ultra",
    },
    {
      text: "Laptop mỏng nhẹ pin trâu dành cho sinh viên IT",
      query: "Laptop mỏng nhẹ pin trâu dành cho sinh viên IT",
    },
    {
      text: "Gợi ý phụ kiện điện thoại & tai nghe chống ồn dưới 2 triệu",
      query: "Gợi ý phụ kiện điện thoại & tai nghe chống ồn dưới 2 triệu",
    },
  ];

  if (!mounted) return null;

  return (
    <PublicLayout fullWidth>
      <div className="flex h-[calc(100vh-60px)] bg-zinc-50 dark:bg-zinc-950 font-sans">
        {/* Sidebar */}
        <div
          className={`${
            sidebarOpen ? "w-72 sm:w-80" : "w-0"
          } transition-all duration-300 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col overflow-hidden shrink-0`}
        >
          {/* Top New Chat Action */}
          <div className="p-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <button
              onClick={createConversation}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors w-full text-left cursor-pointer"
            >
              <Edit3 size={16} className="text-zinc-600 dark:text-zinc-400" />
              <span>Cuộc trò chuyện mới</span>
            </button>
          </div>

          {/* Search Chat Input */}
          <div className="p-3">
            <div className="relative">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
              />
              <input
                type="text"
                placeholder="Tìm cuộc trò chuyện..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-zinc-400"
              />
            </div>
          </div>

          {/* Group Header: Gần đây */}
          <div className="px-4 py-2 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
            Gần đây
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto px-2 space-y-1">
            {filteredConversations.length === 0 ? (
              <div className="p-4 text-center text-zinc-400 text-xs">
                Chưa có cuộc trò chuyện nào
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => loadConversation(conv.id)}
                  className={`group flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ${
                    currentConversation === conv.id
                      ? "bg-zinc-100 dark:bg-zinc-800 font-semibold"
                      : ""
                  }`}
                >
                  <MessageSquare
                    size={15}
                    className="text-zinc-400 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-zinc-800 dark:text-zinc-200 truncate">
                      {conv.title}
                    </p>
                  </div>
                  <button
                    onClick={(e) => deleteConversation(conv.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-red-500 transition-all"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Main Chat Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-zinc-950">

          {/* Messages or Welcome View */}
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto px-4 py-6">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto space-y-6 text-center">
                {/* Header Welcome Title */}
                <div className="space-y-1.5">
                  <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                    ShopWise AI
                  </span>
                  <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
                    Welcome Back
                  </h1>
                  <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                    Tiếp tục nơi bạn đã dừng lại, hoặc bắt đầu cuộc trò chuyện mới
                  </p>
                </div>

                {/* From your last session Card */}
                {lastSession && !hideLastSessionCard && (
                  <div className="w-full max-w-xl bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 text-left space-y-4 shadow-sm relative">
                    <div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
                      <span>
                        Từ phiên làm việc trước • {lastSession.message_count || 1} tin nhắn
                      </span>
                      <button
                        onClick={() => setHideLastSessionCard(true)}
                        className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-black dark:hover:text-white cursor-pointer"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    <h3 className="text-base font-bold text-zinc-900 dark:text-white truncate">
                      {lastSession.title}
                    </h3>

                    {/* Preview Images Grid */}
                    <div className="flex items-center gap-2 overflow-x-auto">
                      {mockPreviewImages.map((src, i) => (
                        <div
                          key={i}
                          className="w-16 h-16 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 p-1 flex items-center justify-center overflow-hidden shrink-0"
                        >
                          <img
                            src={src}
                            alt="preview"
                            className="object-contain max-h-full max-w-full"
                          />
                        </div>
                      ))}
                      <div className="w-16 h-16 rounded-xl bg-zinc-200/60 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-bold text-xs flex items-center justify-center shrink-0">
                        +17
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => loadConversation(lastSession.id)}
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>Tiếp tục phiên này</span>
                        <ArrowRight size={14} />
                      </button>
                      <button
                        onClick={createConversation}
                        className="px-5 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-full text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                      >
                        Bắt đầu mới
                      </button>
                    </div>
                  </div>
                )}

                {/* Central Prominent Input Card */}
                <div className="w-full max-w-xl bg-white dark:bg-zinc-900 border border-blue-200 dark:border-zinc-800 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 rounded-2xl p-4 shadow-sm text-left space-y-3 transition-all">
                  <div className="text-xs text-zinc-400 font-medium">
                    Hoặc nhập nội dung mới...
                  </div>
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Hỏi tôi bất cứ điều gì về sản phẩm công nghệ..."
                    rows={2}
                    className="w-full resize-none border-none outline-none text-sm bg-transparent text-black dark:text-white placeholder:text-zinc-400"
                  />
                  <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 pt-3">
                    <div className="flex items-center gap-2 text-zinc-400">
                      <button className="p-1.5 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer">
                        <ImageIcon size={18} />
                      </button>
                      <button className="p-1.5 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer">
                        <Sliders size={18} />
                      </button>
                    </div>
                    <button
                      onClick={handleSend}
                      disabled={!input.trim() || loading}
                      className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 disabled:opacity-40 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all flex items-center justify-center cursor-pointer"
                    >
                      {loading ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <ArrowUp size={16} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Suggestion Prompts List */}
                <div className="w-full max-w-xl space-y-2 text-left pt-2">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setInput(s.query);
                        inputRef.current?.focus({ preventScroll: true });
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors group cursor-pointer"
                    >
                      <Sparkles
                        size={15}
                        className="text-zinc-400 group-hover:text-blue-500 transition-colors shrink-0"
                      />
                      <span className="truncate">{s.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Active Chat Timeline */
              <div className="max-w-3xl mx-auto space-y-6">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${
                      msg.role === "user" ? "justify-end" : ""
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-5 py-3 text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-black text-white dark:bg-white dark:text-black"
                          : "bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100"
                      }`}
                    >
                      <MarkdownText content={msg.content} />

                      {/* Referenced Products - Rich Horizontal E-Commerce Product Cards */}
                      {((msg.realProducts && msg.realProducts.length > 0) || (msg.sources && msg.sources.length > 0)) && (
                        <div className="mt-4 pt-3.5 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="p-1 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                                <Sparkles size={13} />
                              </div>
                              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                                Sản phẩm gợi ý cho bạn
                              </span>
                            </div>
                            <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/70 px-2 py-0.5 rounded-full border border-blue-200/60 dark:border-blue-800/60">
                              Gợi ý tốt nhất
                            </span>
                          </div>

                          {msg.realProducts && msg.realProducts.length > 0 ? (
                            <ReferencedProducts products={msg.realProducts} onAddToCart={handleAddToCart} />
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-3">
                              {msg.sources?.slice(0, 2).map((s, i) => (
                                <RefProductCard key={i} source={s} />
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Confidence */}
                      {msg.confidence && (
                        <p className="mt-2 text-xs text-zinc-400">
                          Độ tin cậy: {(msg.confidence * 100).toFixed(0)}%
                        </p>
                      )}
                    </div>
                  </div>
                ))}

                {/* Thinking Orb Loading Indicator */}
                {loading && (
                  <div className="flex gap-3 items-center">
                    <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-5 py-3 flex items-center gap-3 shadow-sm">
                      <ThinkingOrb state="composing" size={64} speed={1.60} />
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                        ShopWise AI đang suy nghĩ...
                      </span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Error Message Display */}
          {error && (
            <div className="mx-4 mb-2 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2">
              <AlertCircle size={16} className="text-red-500 shrink-0" />
              <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Bottom Floating Input Bar when in chat */}
          {messages.length > 0 && (
            <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
              <div className="max-w-3xl mx-auto">
                <div className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus-within:border-blue-500 rounded-2xl p-3 flex items-center gap-3 transition-all">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Nhập câu hỏi tiếp theo..."
                    rows={1}
                    className="flex-1 resize-none border-none outline-none text-sm bg-transparent text-black dark:text-white placeholder:text-zinc-400"
                    style={{ maxHeight: "120px" }}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || loading}
                    className="w-8 h-8 rounded-full bg-black text-white dark:bg-white dark:text-black hover:bg-blue-600 dark:hover:bg-blue-500 disabled:opacity-40 transition-all flex items-center justify-center shrink-0 cursor-pointer"
                  >
                    {loading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <ArrowUp size={16} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </PublicLayout>
  );
}
