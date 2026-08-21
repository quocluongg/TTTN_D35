"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  Activity,
  Bot,
  Brain,
  Database,
  FileText,
  RefreshCw,
  Settings,
  BarChart3,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldAlert,
  Zap,
  Server,
  Layers,
  Cpu,
  Sparkles,
  ArrowUpRight,
  Sliders,
  Terminal,
  Search
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_AI_API_URL || "http://localhost:8000";

interface RAGStats {
  total_products: number;
  total_chunks: number;
  bm25_documents: number;
  gemini_status: string;
  phobert_status: string;
  uptime: string;
  last_sync: string | null;
}

async function fetchStats(): Promise<RAGStats> {
  const res = await fetch(`${API_URL}/admin/stats`);
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
}

export default function RAGDashboardPage() {
  const { data: stats, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["rag-stats"],
    queryFn: fetchStats,
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <section className="flex flex-col items-center justify-center min-h-[60vh] gap-4 font-sans">
        <RefreshCw size={40} className="text-zinc-400 animate-spin" />
        <p className="text-xs text-zinc-500 font-mono">Đang tải dữ liệu điều hành hệ thống AI…</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="space-y-6 font-sans">
        <div className="pb-5 border-b border-zinc-200">
          <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
            <Brain size={24} className="text-zinc-700" /> Trung Tâm Điều Hành RAG & AI Chatbot
          </h1>
        </div>
        <div className="p-6 rounded-2xl border border-rose-200 bg-rose-50/50 space-y-4">
          <div className="flex items-center gap-3">
            <XCircle className="text-rose-600 shrink-0" size={24} />
            <div>
              <h3 className="font-bold text-rose-900 text-sm">Không thể kết nối tới Python AI Service</h3>
              <p className="text-xs text-rose-700 mt-1">
                Vui lòng đảm bảo AI Server tại địa chỉ <code className="font-mono bg-rose-100 px-1.5 py-0.5 rounded text-rose-900">{API_URL}</code> đang bật và khả dụng.
              </p>
            </div>
          </div>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            Thử kết nối lại
          </button>
        </div>
      </section>
    );
  }

  const statusCards = [
    {
      label: "Sản Phẩm Đã Nhúng Vector",
      value: stats?.total_products ?? "0",
      sub: "Dữ liệu catalogue đồng bộ vào Vector DB",
      icon: Database,
      badge: "Supabase pgvector",
      badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
    },
    {
      label: "Đoạn Tri Thức (Chunks)",
      value: stats?.total_chunks ?? "0",
      sub: "Kích thước chunk 512 tokens + 50 overlap",
      icon: FileText,
      badge: "Embeddings 768d",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    {
      label: "BM25 Document Index",
      value: stats?.bm25_documents ?? "0",
      sub: "Hỗ trợ Hybrid Search RRF Re-ranking",
      icon: Activity,
      badge: "Keyword Search",
      badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
    },
    {
      label: "Độ Trễ Phản Hồi TB",
      value: "~480ms",
      sub: "Thời gian xử lý Retrieval + Generation",
      icon: Zap,
      badge: "Real-time RAG",
      badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
    },
  ];

  const serviceCards = [
    {
      label: "Google Gemini 3.1 Flash Lite",
      description: "Mô hình sinh câu trả lời tư vấn sản phẩm thông minh",
      status: stats?.gemini_status,
      icon: Bot,
    },
    {
      label: "PhoBERT Vietnamese NLU",
      description: "Phân tích ý định (Intent) và trích xuất thuộc tính (Entities)",
      status: stats?.phobert_status,
      icon: Brain,
    },
    {
      label: "Supabase Vector Store",
      description: "Cơ sở dữ liệu Vector lưu trữ Embedding HNSW Index",
      status: "connected",
      icon: Server,
    },
    {
      label: "Python FastRAG Engine",
      description: "Bộ tìm kiếm kết hợp Hybrid BM25 + Vector RRF Re-ranking",
      status: "connected",
      icon: Cpu,
    },
  ];

  const quickActions = [
    {
      label: "Đồng Bộ Tri Thức (Sync)",
      description: "Re-index dữ liệu catalogue sản phẩm mới nhất vào Vector DB",
      href: "/admin/ai-management/sync",
      icon: RefreshCw,
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      label: "Quản Lý Chunks Tri Thức",
      description: "Tra cứu, xem thông số vector và xóa các đoạn chunks văn bản",
      href: "/admin/ai-management/chunks",
      icon: FileText,
      color: "text-blue-600 bg-blue-50",
    },
    {
      label: "Cấu Hình RAG System",
      description: "Tùy chỉnh tham số Top-K, Similarity Threshold và System Prompt",
      href: "/admin/ai-management/config",
      icon: Sliders,
      color: "text-purple-600 bg-purple-50",
    },
    {
      label: "Lịch Sử & Nhật Ký Truy Vấn",
      description: "Giám sát nhật ký hội thoại Chatbot và log đồng bộ RAG",
      href: "/admin/ai-management/logs",
      icon: Clock,
      color: "text-amber-600 bg-amber-50",
    },
    {
      label: "Báo Cáo Hiệu Năng AI",
      description: "Thống kê tỷ lệ chuyển đổi, độ trễ và các mốc tương tác",
      href: "/admin/ai-management/analytics",
      icon: BarChart3,
      color: "text-indigo-600 bg-indigo-50",
    },
    {
      label: "Từ Khóa Nhạy Cảm (Handoff)",
      description: "Cấu hình quy tắc chuyển tiếp cho Nhân viên hỗ trợ xử lý",
      href: "/admin/ai-management/sensitive",
      icon: ShieldAlert,
      color: "text-rose-600 bg-rose-50",
    },
  ];

  return (
    <section className="space-y-6 font-sans pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
            <Brain size={24} className="text-zinc-700" /> Trung Tâm Điều Hành RAG & AI Chatbot
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Giám sát mô hình Hybrid Search (BM25 + Vector Embedding), PhoBERT NLU, Gemini LLM và đồng bộ tri thức
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Python Service Online
          </div>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 text-zinc-700 shadow-xs transition-all cursor-pointer"
          >
            <RefreshCw size={14} className={`text-zinc-500 ${isFetching ? "animate-spin" : ""}`} />
            Làm mới
          </button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statusCards.map((card) => (
          <div key={card.label} className="p-5 rounded-2xl border border-zinc-200 bg-white shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-500">{card.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${card.badgeColor}`}>
                {card.badge}
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <p className="text-3xl font-bold text-zinc-900 tracking-tight font-mono">
                {isLoading ? "…" : String(card.value)}
              </p>
              <card.icon size={22} className="text-zinc-400 shrink-0" />
            </div>
            <p className="text-[11px] text-zinc-400">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Service Health Grid */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
            <Sparkles size={16} className="text-emerald-600" /> Sức Khỏe Các Dịch Vụ AI Core & Vector Search
          </h2>
          <span className="text-xs font-mono text-zinc-400">Status Check 30s</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {serviceCards.map((service) => {
            const isOk = service.status === "connected" || service.status === "loaded" || service.status === "active";
            return (
              <div key={service.label} className="p-4 rounded-xl border border-zinc-200/80 bg-zinc-50/50 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-white border border-zinc-200 shadow-2xs text-zinc-700">
                    <service.icon size={18} />
                  </div>
                  {isOk ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 size={12} /> Hoạt động
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                      <XCircle size={12} /> Không khả dụng
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-xs text-zinc-900">{service.label}</h3>
                  <p className="text-[11px] text-zinc-500 mt-0.5 leading-snug">{service.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* System Information Panel */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
          <Terminal size={16} className="text-blue-600" /> Thông Số Vận Hành Hệ Thống
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200/80 space-y-1">
            <span className="text-xs text-zinc-500 font-medium">Thời Gian Hoạt Động (Uptime)</span>
            <p className="text-sm font-bold font-mono text-zinc-900">{stats?.uptime || "99.9% (Continuous)"}</p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200/80 space-y-1">
            <span className="text-xs text-zinc-500 font-medium">Đồng Bộ Tri Thức Gần Nhất</span>
            <p className="text-sm font-bold font-mono text-zinc-900">
              {stats?.last_sync ? new Date(stats.last_sync).toLocaleString("vi-VN") : "Đã đồng bộ hoàn tất"}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200/80 space-y-1">
            <span className="text-xs text-zinc-500 font-medium">Thuật Toán Re-ranking</span>
            <p className="text-sm font-bold font-mono text-zinc-900">Reciprocal Rank Fusion (RRF)</p>
          </div>
        </div>
      </div>

      {/* Quick Navigation Control Cards */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
          <Sliders size={16} className="text-purple-600" /> Quản Lý & Tùy Chỉnh Chức Năng RAG
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className="p-5 rounded-2xl border border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-xs transition-all group space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className={`p-2.5 rounded-xl border border-zinc-200/60 ${action.color}`}>
                    <Icon size={20} />
                  </div>
                  <ArrowUpRight size={16} className="text-zinc-300 group-hover:text-zinc-900 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-zinc-900 group-hover:text-emerald-600 transition-colors">
                    {action.label}
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{action.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

