"use client";

import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  Clock,
  Zap,
  Target,
  TrendingUp,
  AlertCircle,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_AI_API_URL || "http://localhost:8000";

interface Analytics {
  total_queries: number;
  avg_latency_ms: number;
  intent_distribution: Record<string, number>;
  top_queried_products: Array<{ product_id: string; count: number }>;
  source_hit_rate: number;
  error_rate: number;
}

async function fetchAnalytics(): Promise<Analytics> {
  const res = await fetch(`${API_URL}/admin/rag/analytics`);
  if (!res.ok) throw new Error("Failed to fetch analytics");
  return res.json();
}

export default function AnalyticsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["rag-analytics"],
    queryFn: fetchAnalytics,
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <section>
        <h1 className="text-[28px] font-medium">Analytics</h1>
        <p className="mt-4 text-zinc-500">Đang tải...</p>
      </section>
    );
  }

  if (error || !data) {
    return (
      <section>
        <h1 className="text-[28px] font-medium">Analytics</h1>
        <p className="mt-4 text-red-500">Không thể tải analytics</p>
      </section>
    );
  }

  const statCards = [
    {
      label: "Total Queries",
      value: data.total_queries,
      icon: Target,
      color: "bg-blue-500",
    },
    {
      label: "Avg Latency",
      value: `${data.avg_latency_ms}ms`,
      icon: Clock,
      color: "bg-green-500",
    },
    {
      label: "Source Hit Rate",
      value: `${(data.source_hit_rate * 100).toFixed(1)}%`,
      icon: Zap,
      color: "bg-purple-500",
    },
    {
      label: "Error Rate",
      value: `${(data.error_rate * 100).toFixed(1)}%`,
      icon: AlertCircle,
      color: "bg-red-500",
    },
  ];

  const intentColors: Record<string, string> = {
    ask_specs: "bg-blue-500",
    ask_price: "bg-green-500",
    compare_products: "bg-purple-500",
    ask_warranty: "bg-orange-500",
    purchase_consultation: "bg-pink-500",
    ask_promotion: "bg-yellow-500",
    order_product: "bg-indigo-500",
    complain: "bg-red-500",
    general_query: "bg-zinc-500",
    out_of_scope: "bg-gray-400",
  };

  const intentLabels: Record<string, string> = {
    ask_specs: "Hỏi thông số",
    ask_price: "Hỏi giá",
    compare_products: "So sánh",
    ask_warranty: "Bảo hành",
    purchase_consultation: "Tư vấn",
    ask_promotion: "Khuyến mãi",
    order_product: "Đặt hàng",
    complain: "Khiếu nại",
    general_query: "Chung",
    out_of_scope: "Ngoại lệ",
  };

  const maxIntentCount = Math.max(...Object.values(data.intent_distribution), 1);

  return (
    <section>
      {/* Header */}
      <div className="border-b border-black pb-5">
        <h1 className="text-[28px] font-medium">Analytics</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Hiệu suất hệ thống RAG
        </p>
      </div>

      {/* Stat Cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <article key={card.label} className="border border-black bg-white p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-zinc-600">{card.label}</p>
              <card.icon size={20} className="text-zinc-400" />
            </div>
            <p className="mt-2 text-2xl font-medium">{card.value}</p>
          </article>
        ))}
      </div>

      {/* Intent Distribution */}
      <div className="mt-6 border border-black bg-white p-5">
        <h2 className="text-lg font-medium mb-4">Intent Distribution</h2>
        <div className="space-y-3">
          {Object.entries(data.intent_distribution)
            .sort(([, a], [, b]) => b - a)
            .map(([intent, count]) => (
              <div key={intent} className="flex items-center gap-3">
                <span className="text-sm w-32 text-zinc-600">
                  {intentLabels[intent] || intent}
                </span>
                <div className="flex-1 bg-zinc-100 rounded-full h-6 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${intentColors[intent] || "bg-zinc-500"}`}
                    style={{ width: `${(count / maxIntentCount) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium w-12 text-right">{count}</span>
              </div>
            ))}
        </div>
      </div>

      {/* Top Queried Products */}
      <div className="mt-6 border border-black bg-white p-5">
        <h2 className="text-lg font-medium mb-4">Top Queried Products</h2>
        {data.top_queried_products.length === 0 ? (
          <p className="text-sm text-zinc-500">Chưa có dữ liệu</p>
        ) : (
          <div className="space-y-2">
            {data.top_queried_products.map((item, i) => (
              <div
                key={item.product_id}
                className="flex items-center justify-between border-b border-zinc-200 pb-2"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-zinc-400">#{i + 1}</span>
                  <span className="text-sm">{item.product_id.substring(0, 20)}...</span>
                </div>
                <span className="text-sm font-medium">{item.count} queries</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
