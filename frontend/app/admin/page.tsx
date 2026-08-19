"use client";

import { useQuery } from "@tanstack/react-query";
import { adminReportService } from "@/services/admin/adminReportService";
import { DollarSign, ShoppingBag, AlertTriangle, TrendingUp, RefreshCw, BarChart2 } from "lucide-react";

const unwrap = (x: any) => x?.data ?? x;

export default function AdminPage() {
  const revenue = useQuery({ queryKey: ["dashboard", "revenue"], queryFn: () => adminReportService.revenue({ groupBy: "day" }) });
  const status = useQuery({ queryKey: ["dashboard", "status"], queryFn: () => adminReportService.orderStatus() });
  const low = useQuery({ queryKey: ["dashboard", "low"], queryFn: () => adminReportService.lowStock({ threshold: 10 }) });
  const top = useQuery({ queryKey: ["dashboard", "top"], queryFn: () => adminReportService.topProducts({ limit: 5 }) });

  const rev = unwrap(revenue.data) || {};
  const statusRows = unwrap(status.data) || [];
  const lowRows = unwrap(low.data) || [];
  const topRows = unwrap(top.data) || [];
  const dataRows = (x: any) => Array.isArray(x) ? x : x.content ?? [];

  const revList = dataRows(rev);
  const rawRevenue = revList.reduce((sum: number, item: any) => sum + Number(item.totalAmount ?? item.revenue ?? item.total ?? 0), 0);
  const formattedRevenue = `${rawRevenue.toLocaleString("vi-VN")} ₫`;
  const totalOrders = dataRows(statusRows).reduce((n: number, x: any) => n + Number(x.count ?? 0), 0);
  const lowStockCount = dataRows(lowRows).length;
  const topProductCount = dataRows(topRows).length;

  const cards = [
    { label: "Doanh thu hệ thống", value: formattedRevenue, icon: DollarSign, color: "text-indigo-600 dark:text-indigo-400" },
    { label: "Tổng số đơn hàng", value: totalOrders, icon: ShoppingBag, color: "text-blue-600 dark:text-blue-400" },
    { label: "Cảnh báo tồn kho thấp", value: lowStockCount, icon: AlertTriangle, color: lowStockCount > 0 ? "text-amber-500" : "text-emerald-500" },
    { label: "Sản phẩm bán chạy", value: topProductCount, icon: TrendingUp, color: "text-emerald-600 dark:text-emerald-400" },
  ];

  return (
    <section className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Tổng quan vận hành</h1>
          <p className="mt-1 text-xs text-zinc-500 font-mono">Báo cáo & số liệu tổng quan thời gian thực từ hệ thống.</p>
        </div>

        <button
          onClick={() => {
            revenue.refetch();
            status.refetch();
            low.refetch();
            top.refetch();
          }}
          className="p-2.5 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1.5 text-xs font-semibold self-start sm:self-auto"
        >
          <RefreshCw size={14} className={`text-zinc-500 ${revenue.isFetching ? "animate-spin" : ""}`} /> Làm mới dữ liệu
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.label} className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-zinc-400 uppercase">{item.label}</p>
                <p className="mt-1.5 text-2xl font-extrabold font-mono text-zinc-900 dark:text-white">
                  {revenue.isLoading ? "…" : item.value}
                </p>
              </div>
              <div className={`p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 ${item.color}`}>
                <Icon size={22} />
              </div>
            </article>
          );
        })}
      </div>

      {/* Reports Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Report title="Đơn hàng theo trạng thái" data={dataRows(statusRows)} loading={status.isLoading} />
        <Report title="Sản phẩm bán chạy hàng đầu" data={dataRows(topRows)} loading={top.isLoading} />
      </div>
    </section>
  );
}

function Report({ title, data, loading }: { title: string; data: any[]; loading: boolean }) {
  return (
    <article className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-4">
      <h2 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
        <BarChart2 size={18} className="text-indigo-600" /> {title}
      </h2>

      {loading ? (
        <div className="p-8 text-center text-xs font-mono text-zinc-400 flex items-center justify-center gap-2">
          <RefreshCw size={14} className="animate-spin" /> Đang tải báo cáo...
        </div>
      ) : data.length ? (
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {data.slice(0, 5).map((item, index) => (
            <div className="flex justify-between py-3 text-xs" key={item.id || index}>
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">{item.name || item.productName || item.status || "—"}</span>
              <strong className="font-mono text-indigo-600 dark:text-indigo-400">{item.count ?? item.quantity ?? item.revenue ?? "—"}</strong>
            </div>
          ))}
        </div>
      ) : (
        <p className="p-6 text-center text-xs text-zinc-400 italic">Chưa có dữ liệu báo cáo.</p>
      )}
    </article>
  );
}
