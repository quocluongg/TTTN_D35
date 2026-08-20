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
  Zap,
  CheckCircle,
  XCircle,
  Clock,
  ShieldAlert,
} from "lucide-react";


const API_URL = process.env.NEXT_PUBLIC_AI_API_URL || "http://localhost:8000";

interface RAGStats {
  total_products: number;
  total_chunks: number;
  faiss_vectors: number;
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
  const { data: stats, isLoading, error, refetch } = useQuery({
    queryKey: ["rag-stats"],
    queryFn: fetchStats,
    refetchInterval: 30000, // Refresh every 30s
  });

  if (isLoading) {
    return (
      <section className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <RefreshCw size={40} className="text-zinc-400 animate-spin" />
        <p className="text-sm text-zinc-500">Đang tải dữ liệu hệ thống AI…</p>
      </section>
    );
  }

  if (error) {
    return (
      <section>
        <div className="border-b border-black pb-5">
          <h1 className="text-[28px] font-medium">RAG System Management</h1>
        </div>
        <div className="mt-6 border border-red-300 bg-red-50 p-6 rounded-lg">
          <div className="flex items-center gap-3">
            <XCircle className="text-red-500" size={24} />
            <div>
              <h3 className="font-medium text-red-800">Không thể kết nối AI Server</h3>
              <p className="text-sm text-red-600 mt-1">
                Đảm bảo AI server đang chạy tại {API_URL}
              </p>
            </div>
          </div>
          <button
            onClick={() => refetch()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Thử lại
          </button>
        </div>
      </section>
    );
  }

  const statusCards = [
    {
      label: "Sản phẩm",
      value: stats?.total_products ?? "—",
      icon: Database,
      color: "bg-blue-500",
    },
    {
      label: "Chunks",
      value: stats?.total_chunks ?? "—",
      icon: FileText,
      color: "bg-green-500",
    },
    {
      label: "FAISS Vectors",
      value: stats?.faiss_vectors ?? "—",
      icon: Zap,
      color: "bg-purple-500",
    },
    {
      label: "BM25 Documents",
      value: stats?.bm25_documents ?? "—",
      icon: Activity,
      color: "bg-orange-500",
    },
  ];

  const serviceCards = [
    {
      label: "Gemini LLM",
      status: stats?.gemini_status,
      icon: Bot,
    },
    {
      label: "PhoBERT NLU",
      status: stats?.phobert_status,
      icon: Brain,
    },
  ];

  const quickActions = [
    {
      label: "Quản lý Sync",
      description: "Đồng bộ sản phẩm vào RAG",
      href: "/admin/ai-management/sync",
      icon: RefreshCw,
    },
    {
      label: "Quản lý Chunks",
      description: "Xem, tìm kiếm, xóa chunks",
      href: "/admin/ai-management/chunks",
      icon: FileText,
    },
    {
      label: "Cấu hình Hệ thống",
      description: "LLM, Retrieval, NLU settings",
      href: "/admin/ai-management/config",
      icon: Settings,
    },
    {
      label: "Logs & History",
      description: "Chat history, sync logs",
      href: "/admin/ai-management/logs",
      icon: Clock,
    },
    {
      label: "Analytics",
      description: "Performance metrics",
      href: "/admin/ai-management/analytics",
      icon: BarChart3,
    },
    {
      label: "Câu hỏi nhạy cảm",
      description: "Quản lý từ khóa cần handoff",
      href: "/admin/ai-management/sensitive",
      icon: ShieldAlert,
    },
  ];

  return (
    <section>
      {/* Header */}
      <div className="border-b border-black pb-5 flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-medium">RAG System Management</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Quản lý hệ thống AI Chatbot - FAISS + Supabase + Gemini
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2 border border-black rounded hover:bg-zinc-100"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Status Cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statusCards.map((card) => (
          <article
            key={card.label}
            className="border border-black bg-white p-5"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-zinc-600">{card.label}</p>
              <card.icon size={20} className="text-zinc-400" />
            </div>
            <p className="mt-2 text-2xl font-medium">
              {isLoading ? "…" : String(card.value)}
            </p>
          </article>
        ))}
      </div>

      {/* Service Status */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {serviceCards.map((service) => (
          <article
            key={service.label}
            className="border border-black bg-white p-5"
          >
            <div className="flex items-center gap-3">
              <service.icon size={24} className="text-zinc-600" />
              <div>
                <p className="font-medium">{service.label}</p>
                <div className="flex items-center gap-2 mt-1">
                  {service.status === "connected" || service.status === "loaded" ? (
                    <>
                      <CheckCircle size={14} className="text-green-500" />
                      <span className="text-sm text-green-600">Hoạt động</span>
                    </>
                  ) : (
                    <>
                      <XCircle size={14} className="text-red-500" />
                      <span className="text-sm text-red-600">Không khả dụng</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* System Info */}
      <div className="mt-6 border border-black bg-white p-5">
        <h2 className="text-lg font-medium mb-4">Thông tin hệ thống</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex justify-between border-b border-zinc-200 pb-2">
            <span className="text-sm text-zinc-600">Uptime</span>
            <span className="text-sm font-medium">{stats?.uptime ?? "—"}</span>
          </div>
          <div className="flex justify-between border-b border-zinc-200 pb-2">
            <span className="text-sm text-zinc-600">Last Sync</span>
            <span className="text-sm font-medium">
              {stats?.last_sync
                ? new Date(stats.last_sync).toLocaleString("vi-VN")
                : "Chưa sync"}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6">
        <h2 className="text-lg font-medium mb-4">Quản lý nhanh</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="border border-black bg-white p-5 hover:bg-zinc-50 transition-colors"
            >
              <action.icon size={24} className="text-blue-600 mb-3" />
              <p className="font-medium">{action.label}</p>
              <p className="text-sm text-zinc-600 mt-1">{action.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
