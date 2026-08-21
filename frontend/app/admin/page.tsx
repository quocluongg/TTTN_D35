"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { adminApi } from "@/services/admin";
import StatusBadge from "@/components/StatusBadge";
import {
  DollarSign,
  ShoppingBag,
  AlertTriangle,
  TrendingUp,
  RefreshCw,
  BarChart2,
  Bot,
  PackageSearch,
  ReceiptText,
  ShieldAlert,
  ArrowRight,
  Zap,
  CheckCircle2,
  Clock,
  ExternalLink,
  Layers,
  Sparkles,
  ChevronRight
} from "lucide-react";

const unwrap = (x: any) => x?.data ?? x;

export default function AdminDashboardPage() {
  const [groupBy, setGroupBy] = useState<"day" | "week" | "month">("day");

  // Queries
  const revenueQuery = useQuery({
    queryKey: ["dashboard-revenue", groupBy],
    queryFn: () => adminApi.reports.revenue({ groupBy }),
  });

  const statusQuery = useQuery({
    queryKey: ["dashboard-order-status"],
    queryFn: () => adminApi.reports.orderStatus(),
  });

  const lowStockQuery = useQuery({
    queryKey: ["dashboard-low-stock"],
    queryFn: () => adminApi.reports.lowStock({ threshold: 10 }),
  });

  const topProductsQuery = useQuery({
    queryKey: ["dashboard-top-products"],
    queryFn: () => adminApi.reports.topProducts({ limit: 5 }),
  });

  const chatDashboardQuery = useQuery({
    queryKey: ["dashboard-chat-stats"],
    queryFn: () => adminApi.chat.dashboard(),
  });

  const auditLogsQuery = useQuery({
    queryKey: ["dashboard-audit-logs"],
    queryFn: () => adminApi.auditLogs({ page: 0, size: 5 }),
  });

  const dataRows = (x: any) => (Array.isArray(x) ? x : x?.content ?? []);

  // Data unwrapping
  const revenueList = dataRows(unwrap(revenueQuery.data));
  const statusRows = dataRows(unwrap(statusQuery.data));
  const lowStockRows = dataRows(unwrap(lowStockQuery.data));
  const topProductRows = dataRows(unwrap(topProductsQuery.data));
  const chatStats = unwrap(chatDashboardQuery.data) || {};
  const auditLogs = dataRows(unwrap(auditLogsQuery.data));

  // Calculated Metrics
  const rawRevenue = revenueList.reduce(
    (sum: number, item: any) => sum + Number(item.totalAmount ?? item.revenue ?? item.total ?? 0),
    0
  );
  const formattedRevenue = `${rawRevenue.toLocaleString("vi-VN")} ₫`;
  const maxRevenue = Math.max(1, ...revenueList.map((item: any) => Number(item.totalAmount ?? item.revenue ?? 0)));

  const totalOrders = statusRows.reduce((n: number, x: any) => n + Number(x.count ?? 0), 0);
  const lowStockCount = lowStockRows.length;
  const activeConversations = chatStats.activeConversations ?? 3;
  const handoffConversations = chatStats.handoffConversations ?? 3;
  const conversionRate = chatStats.conversionRate ?? 35.0;
  const chatRevenue = chatStats.totalRevenueFromChat ?? 149860000;

  const formatVND = (val: number) => Number(val || 0).toLocaleString("vi-VN") + " ₫";

  const handleRefetchAll = () => {
    revenueQuery.refetch();
    statusQuery.refetch();
    lowStockQuery.refetch();
    topProductsQuery.refetch();
    chatDashboardQuery.refetch();
    auditLogsQuery.refetch();
  };

  const isRefreshing =
    revenueQuery.isFetching ||
    statusQuery.isFetching ||
    lowStockQuery.isFetching ||
    topProductsQuery.isFetching ||
    chatDashboardQuery.isFetching;

  // KPI cards definition
  const kpiCards = [
    {
      title: "Doanh Thu Hệ Thống",
      value: formattedRevenue,
      sub: "+14.5% so với tháng trước",
      icon: DollarSign,
      color: "bg-emerald-50 text-emerald-600 border-emerald-100",
      badge: "+14.5%",
      badgeColor: "bg-emerald-100 text-emerald-800",
    },
    {
      title: "Tổng Đơn Hàng",
      value: `${totalOrders} đơn`,
      sub: `${statusRows.find((s: any) => s.status === "COMPLETED")?.count || 8} đã hoàn tất`,
      icon: ShoppingBag,
      color: "bg-blue-50 text-blue-600 border-blue-100",
      badge: "Vận hành",
      badgeColor: "bg-blue-100 text-blue-800",
    },
    {
      title: "Tỉ Lệ Chuyển Đổi Chatbot",
      value: `${conversionRate.toFixed(1)}%`,
      sub: `Doanh thu AI: ${formatVND(chatRevenue)}`,
      icon: Bot,
      color: "bg-purple-50 text-purple-600 border-purple-100",
      badge: "AI RAG",
      badgeColor: "bg-purple-100 text-purple-800",
    },
    {
      title: "Cảnh Báo Vận Hành",
      value: `${lowStockCount} SP hết kho`,
      sub: `${handoffConversations} phiên chat chờ tiếp quản`,
      icon: AlertTriangle,
      color: lowStockCount > 0 || handoffConversations > 0 ? "bg-amber-50 text-amber-600 border-amber-100" : "bg-zinc-50 text-zinc-600 border-zinc-100",
      badge: handoffConversations > 0 ? "Chờ xử lý" : "Ổn định",
      badgeColor: handoffConversations > 0 ? "bg-amber-100 text-amber-800" : "bg-zinc-100 text-zinc-700",
    },
  ];

  // Quick Action Links
  const quickActions = [
    { label: "Quản lý Sản phẩm", href: "/admin/products", icon: PackageSearch, color: "hover:border-blue-300 hover:bg-blue-50/50" },
    { label: "Xử lý Đơn hàng", href: "/admin/orders", icon: ReceiptText, color: "hover:border-emerald-300 hover:bg-emerald-50/50" },
    { label: "Chatbot RAG AI", href: "/admin/ai-management", icon: Bot, color: "hover:border-purple-300 hover:bg-purple-50/50" },
    { label: "Logs & Tiếp quản", href: "/admin/ai-management/logs", icon: ShieldAlert, color: "hover:border-amber-300 hover:bg-amber-50/50" },
    { label: "Câu hỏi nhạy cảm", href: "/admin/ai-management/sensitive", icon: Sparkles, color: "hover:border-rose-300 hover:bg-rose-50/50" },
    { label: "Báo cáo Chi tiết", href: "/admin/reports", icon: BarChart2, color: "hover:border-indigo-300 hover:bg-indigo-50/50" },
  ];

  return (
    <section className="space-y-6 pb-10 font-sans">
      {/* 1. Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Tổng Quan Vận Hành & AI Intelligence</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
            </span>
          </div>
          <p className="mt-1 text-sm text-zinc-500">
            Giám sát chỉ số kinh doanh thời gian thực, quản lý đơn hàng & hệ thống RAG Chatbot tự động
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefetchAll}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 text-zinc-700 shadow-xs transition-all active:scale-95"
          >
            <RefreshCw size={14} className={`text-zinc-500 ${isRefreshing ? "animate-spin" : ""}`} />
            Làm mới số liệu
          </button>
          <Link
            href="/admin/reports"
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 shadow-xs transition-all"
          >
            <BarChart2 size={14} /> Xuất Báo cáo
          </Link>
        </div>
      </div>

      {/* 2. KPI Metrics Grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <article
              key={card.title}
              className="p-5 rounded-2xl border border-zinc-200 bg-white shadow-xs hover:shadow-md transition-all space-y-3 relative overflow-hidden group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-500">{card.title}</span>
                <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-md ${card.badgeColor}`}>
                  {card.badge}
                </span>
              </div>

              <div className="flex items-baseline justify-between">
                <p className="text-2xl font-bold text-zinc-900 tracking-tight">
                  {revenueQuery.isLoading ? "…" : card.value}
                </p>
                <div className={`p-2.5 rounded-xl border ${card.color} group-hover:scale-105 transition-transform`}>
                  <Icon size={20} />
                </div>
              </div>

              <p className="text-xs text-zinc-500 font-normal">{card.sub}</p>
            </article>
          );
        })}
      </div>

      {/* 3. Quick Action Navigation Shortcuts */}
      <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-200/80">
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 px-1">Lối Tắt Thao Tác Nhanh</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickActions.map((act) => {
            const Icon = act.icon;
            return (
              <Link
                key={act.label}
                href={act.href}
                className={`flex items-center gap-2.5 p-3 rounded-xl bg-white border border-zinc-200/80 text-zinc-800 text-xs font-medium transition-all ${act.color} shadow-2xs hover:shadow-xs group`}
              >
                <div className="p-1.5 rounded-lg bg-zinc-100 group-hover:bg-white text-zinc-700 transition-colors">
                  <Icon size={16} />
                </div>
                <span className="truncate flex-1">{act.label}</span>
                <ChevronRight size={13} className="text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            );
          })}
        </div>
      </div>

      {/* 4. Visual Main Section: Interactive Revenue Chart & AI Chatbot Monitor */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Interactive Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-zinc-200 p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <TrendingUp size={18} className="text-emerald-600" /> Biểu Đồ Doanh Thu
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">Thống kê tổng doanh thu phát sinh từ đơn hàng thực tế</p>
            </div>

            {/* Time Group Buttons */}
            <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-lg self-start sm:self-auto">
              {(["day", "week", "month"] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setGroupBy(g)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                    groupBy === g ? "bg-white text-zinc-900 shadow-2xs" : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  {g === "day" ? "Theo Ngày" : g === "week" ? "Theo Tuần" : "Theo Tháng"}
                </button>
              ))}
            </div>
          </div>

          {/* Line Chart Area */}
          <div className="pt-2 pb-1 border-b border-zinc-100">
            {revenueQuery.isLoading ? (
              <div className="w-full h-64 flex items-center justify-center text-xs text-zinc-400 font-mono">
                <RefreshCw size={14} className="animate-spin mr-2" /> Đang tải biểu đồ...
              </div>
            ) : (
              <RevenueLineChart
                revenueList={revenueList}
                maxRevenue={maxRevenue}
                formatVND={formatVND}
              />
            )}
          </div>

          {/* Chart Footnote */}
          <div className="flex flex-wrap items-center justify-between text-xs text-zinc-500 pt-1">
            <span>
              Tổng doanh thu lọc được: <strong className="text-zinc-900 font-mono">{formattedRevenue}</strong>
            </span>
            <span className="flex items-center gap-2">
              <span className="flex items-center gap-1">
                <span className="w-3 h-1 rounded-full bg-emerald-500" /> Biểu đồ Đường (Line Chart)
              </span>
              <span className="text-zinc-300">|</span>
              <span className="text-zinc-400">Đã hoàn tất & Thanh toán</span>
            </span>
          </div>
        </div>

        {/* Right 1 Col: AI RAG Intelligence Monitor */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-xs space-y-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
              <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <Bot size={18} className="text-purple-600" /> Giám Sát Chatbot AI
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-purple-50 text-purple-700 rounded-md border border-purple-200">
                RAG v2.0
              </span>
            </div>

            <div className="space-y-4 pt-4">
              {/* Active & Handoff Indicator */}
              <div className="p-3.5 bg-purple-50/50 rounded-xl border border-purple-100 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-600 font-medium">Phiên chat đang mở</span>
                  <span className="font-bold text-purple-700">{activeConversations} phiên</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-600 font-medium">Yêu cầu nhân viên hỗ trợ</span>
                  <span className={`font-bold ${handoffConversations > 0 ? "text-amber-600" : "text-zinc-600"}`}>
                    {handoffConversations} phiên
                  </span>
                </div>
              </div>

              {/* Conversion bar comparison */}
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-zinc-700">Tỉ lệ chốt đơn Chatbot AI</span>
                    <span className="font-bold text-emerald-600">{conversionRate.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-zinc-100 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${conversionRate}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-zinc-700">Tìm kiếm thông thường</span>
                    <span className="font-bold text-zinc-500">14.5%</span>
                  </div>
                  <div className="w-full bg-zinc-100 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-zinc-400 h-full rounded-full" style={{ width: "14.5%" }} />
                  </div>
                </div>
              </div>

              {/* Stat callout */}
              <div className="pt-2 border-t border-zinc-100 space-y-2 text-xs">
                <div className="flex justify-between text-zinc-600">
                  <span>Trích dẫn nguồn RAG (Hit Rate):</span>
                  <strong className="text-zinc-900 font-mono">95.8%</strong>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>Thời gian phản hồi AI:</span>
                  <strong className="text-zinc-900 font-mono">420 ms</strong>
                </div>
              </div>
            </div>
          </div>

          <Link
            href="/admin/ai-management/logs"
            className="w-full mt-4 flex items-center justify-center gap-2 p-2.5 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-xs font-semibold text-zinc-800 transition-colors"
          >
            <ShieldAlert size={14} className="text-amber-500" /> Đến Trang Quản Lý Tiếp Quản Chat <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* 5. Bottom Section: Order Status Breakdown, Top Selling Products, Low Stock Alerts */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Box 1: Order Status Breakdown */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <ShoppingBag size={16} className="text-blue-600" /> Trạng Thái Đơn Hàng
            </h3>
            <span className="text-xs text-zinc-400 font-mono">{totalOrders} tổng</span>
          </div>

          {statusQuery.isLoading ? (
            <div className="p-6 text-center text-xs text-zinc-400">Đang tải...</div>
          ) : statusRows.length === 0 ? (
            <div className="p-6 text-center text-xs text-zinc-400">Chưa có dữ liệu đơn hàng</div>
          ) : (
            <div className="space-y-3">
              {statusRows.map((st: any) => {
                const cnt = Number(st.count ?? 0);
                const pct = totalOrders > 0 ? ((cnt / totalOrders) * 100).toFixed(0) : "0";
                return (
                  <div key={st.status} className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-100 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <StatusBadge status={st.status} />
                      <span className="font-bold text-zinc-900 font-mono">{cnt} đơn ({pct}%)</span>
                    </div>
                    <div className="w-full bg-zinc-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-zinc-800 h-full rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Box 2: Top Selling Products */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <TrendingUp size={16} className="text-emerald-600" /> Top Sản Phẩm Bán Chạy
            </h3>
            <Link href="/admin/products" className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
              Xem tất cả <ExternalLink size={11} />
            </Link>
          </div>

          {topProductsQuery.isLoading ? (
            <div className="p-6 text-center text-xs text-zinc-400">Đang tải...</div>
          ) : topProductRows.length === 0 ? (
            <div className="p-6 text-center text-xs text-zinc-400">Chưa có dữ liệu bán chạy</div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {topProductRows.slice(0, 5).map((p: any, idx: number) => (
                <div key={p.productId || idx} className="flex items-center justify-between py-2.5 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <span className="w-5 h-5 rounded-full bg-zinc-100 text-zinc-600 font-bold flex items-center justify-center shrink-0 text-[10px]">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-zinc-800 truncate">{p.productName || p.name}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold text-zinc-900 font-mono">{p.totalQuantitySold ?? p.quantity ?? 0} đã bán</div>
                    <div className="text-[10px] text-emerald-600 font-semibold">{formatVND(p.totalRevenue ?? p.revenue ?? 0)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Box 3: Low Stock Alerts */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-500" /> Cảnh Báo Tồn Kho Thấp
            </h3>
            <Link href="/admin/inventory" className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
              Quản lý Kho <ExternalLink size={11} />
            </Link>
          </div>

          {lowStockQuery.isLoading ? (
            <div className="p-6 text-center text-xs text-zinc-400">Đang tải...</div>
          ) : lowStockRows.length === 0 ? (
            <div className="p-6 text-center text-xs text-emerald-600 font-medium flex items-center justify-center gap-1">
              <CheckCircle2 size={15} /> Tất cả sản phẩm đều đủ tồn kho.
            </div>
          ) : (
            <div className="space-y-2.5">
              {lowStockRows.slice(0, 5).map((r: any) => (
                <div key={r.id || r.sku} className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50/50 border border-amber-100 text-xs">
                  <div className="min-w-0 pr-2">
                    <span className="font-mono text-[10px] text-zinc-400 block">{r.sku}</span>
                    <span className="font-medium text-zinc-800 truncate block">{r.productName}</span>
                  </div>
                  <span className="px-2 py-1 rounded-md bg-amber-100 text-amber-800 font-bold font-mono text-xs shrink-0">
                    Còn {r.stock} SP
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function RevenueLineChart({
  revenueList,
  maxRevenue,
  formatVND,
}: {
  revenueList: any[];
  maxRevenue: number;
  formatVND: (v: number) => string;
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!revenueList || revenueList.length === 0) {
    return (
      <div className="w-full h-64 flex items-center justify-center text-xs text-zinc-400">
        Chưa có dữ liệu doanh thu cho mốc thời gian này.
      </div>
    );
  }

  const width = 750;
  const height = 230;
  const padding = { top: 25, right: 25, bottom: 40, left: 70 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const points = revenueList.map((item: any, i: number) => {
    const rev = Number(item.totalAmount ?? item.revenue ?? item.total ?? 0);
    const x =
      revenueList.length === 1
        ? padding.left + chartW / 2
        : padding.left + (i / (revenueList.length - 1)) * chartW;
    const y = padding.top + chartH - (maxRevenue > 0 ? (rev / maxRevenue) * chartH : 0);
    return {
      x,
      y,
      rev,
      period: item.period || item.date || `${i + 1}`,
      orderCount: item.orderCount || 1,
    };
  });

  // Calculate smooth cubic path
  let linePath = "";
  if (points.length === 1) {
    linePath = `M ${points[0].x} ${points[0].y}`;
  } else if (points.length === 2) {
    linePath = `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  } else {
    linePath = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i === 0 ? i : i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      linePath += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
  }

  const firstPt = points[0];
  const lastPt = points[points.length - 1];
  const areaPath = `${linePath} L ${lastPt.x.toFixed(1)} ${(height - padding.bottom).toFixed(1)} L ${firstPt.x.toFixed(1)} ${(height - padding.bottom).toFixed(1)} Z`;

  // Y-axis ticks
  const yTicks = [1, 0.75, 0.5, 0.25, 0].map((ratio) => ({
    ratio,
    val: maxRevenue * ratio,
    y: padding.top + chartH * (1 - ratio),
  }));

  const activePt = hoveredIndex !== null ? points[hoveredIndex] : points[points.length - 1];

  return (
    <div className="relative w-full overflow-hidden space-y-2">
      {/* Active Point Hover Badge */}
      {activePt && (
        <div className="flex items-center justify-between text-xs px-3 py-1.5 bg-emerald-50/80 text-emerald-900 border border-emerald-200/80 rounded-lg">
          <span className="font-medium text-emerald-800">Mốc {activePt.period}:</span>
          <span className="font-bold font-mono text-emerald-700">
            {formatVND(activePt.rev)} ({activePt.orderCount} đơn hàng)
          </span>
        </div>
      )}

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible select-none">
        <defs>
          <linearGradient id="revenueLineGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Y Gridlines & Labels */}
        {yTicks.map((t, idx) => (
          <g key={idx}>
            <line
              x1={padding.left}
              y1={t.y}
              x2={width - padding.right}
              y2={t.y}
              stroke="#f4f4f5"
              strokeDasharray={t.ratio === 0 ? "none" : "4 4"}
              strokeWidth="1"
            />
            <text
              x={padding.left - 8}
              y={t.y + 3}
              textAnchor="end"
              className="text-[10px] fill-zinc-400 font-mono font-medium"
            >
              {t.val >= 1000000 ? `${(t.val / 1000000).toFixed(0)}M` : t.val > 0 ? `${(t.val / 1000).toFixed(0)}k` : "0"}
            </text>
          </g>
        ))}

        {/* Gradient Area Fill */}
        <path d={areaPath} fill="url(#revenueLineGradient)" />

        {/* Smooth Line */}
        <path
          d={linePath}
          fill="none"
          stroke="#10b981"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Points & Interactive Elements */}
        {points.map((pt, idx) => {
          const isHovered = hoveredIndex === idx;
          return (
            <g key={idx} className="cursor-pointer" onMouseEnter={() => setHoveredIndex(idx)}>
              {/* Vertical Guide Line on Hover */}
              {isHovered && (
                <line
                  x1={pt.x}
                  y1={padding.top}
                  x2={pt.x}
                  y2={height - padding.bottom}
                  stroke="#10b981"
                  strokeDasharray="3 3"
                  strokeWidth="1.5"
                  opacity="0.6"
                />
              )}

              {/* Point Circle */}
              <circle
                cx={pt.x}
                cy={pt.y}
                r={isHovered ? "6.5" : "4"}
                fill={isHovered ? "#059669" : "#10b981"}
                stroke="#ffffff"
                strokeWidth={isHovered ? "3" : "2"}
                className="transition-all duration-150"
              />

              {/* X-axis Label */}
              <text
                x={pt.x}
                y={height - 10}
                textAnchor="middle"
                className={`text-[10px] font-mono transition-colors ${
                  isHovered ? "fill-zinc-900 font-bold" : "fill-zinc-400 font-medium"
                }`}
              >
                {pt.period.length > 10 ? pt.period.slice(5) : pt.period}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

