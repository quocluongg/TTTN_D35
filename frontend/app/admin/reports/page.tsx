"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/services/admin";
import DateRangePicker, { type DateRange } from "@/components/DateRangePicker";
import DataTable, { type Column } from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import { BarChart3, TrendingUp, Users, Package, AlertTriangle } from "lucide-react";

const unwrap = (x: any) => x?.data ?? x;

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<"revenue" | "products" | "customers" | "status" | "inventory">("revenue");
  const [range, setRange] = useState<DateRange>({ from: "", to: "" });
  const [groupBy, setGroupBy] = useState<"day" | "week" | "month">("day");
  const [lowStockThreshold, setLowStockThreshold] = useState(10);

  const cleanParams = {
    from: range.from || undefined,
    to: range.to || undefined,
  };

  // Reports Queries
  const revenueQuery = useQuery({
    queryKey: ["report-revenue", cleanParams, groupBy],
    queryFn: () => adminApi.reports.revenue({ ...cleanParams, groupBy }),
    enabled: activeTab === "revenue",
  });

  const topProductsQuery = useQuery({
    queryKey: ["report-top-products", cleanParams],
    queryFn: () => adminApi.reports.topProducts({ ...cleanParams, limit: 10 }),
    enabled: activeTab === "products",
  });

  const topCustomersQuery = useQuery({
    queryKey: ["report-top-customers", cleanParams],
    queryFn: () => adminApi.reports.topCustomers({ ...cleanParams, limit: 10 }),
    enabled: activeTab === "customers",
  });

  const orderStatusQuery = useQuery({
    queryKey: ["report-order-status", cleanParams],
    queryFn: () => adminApi.reports.orderStatus({ ...cleanParams }),
    enabled: activeTab === "status",
  });

  const lowStockQuery = useQuery({
    queryKey: ["report-low-stock", lowStockThreshold],
    queryFn: () => adminApi.reports.lowStock({ threshold: lowStockThreshold }),
    enabled: activeTab === "inventory",
  });

  const revenueData = unwrap(revenueQuery.data) || [];
  const topProductsData = unwrap(topProductsQuery.data) || [];
  const topCustomersData = unwrap(topCustomersQuery.data) || [];
  const orderStatusData = unwrap(orderStatusQuery.data) || [];
  const lowStockData = unwrap(lowStockQuery.data) || [];

  const formatVND = (val: number) => Number(val || 0).toLocaleString("vi-VN") + " ₫";

  // Revenue chart values
  const revenueList: any[] = Array.isArray(revenueData) ? revenueData : revenueData.content || [];
  const chartValues = revenueList.map((item) => Number(item.totalAmount ?? item.totalRevenue ?? item.revenue ?? item.total ?? 0));
  const maxRevenue = Math.max(1, ...chartValues);

  // Top Products Columns
  const productColumns: Column<any>[] = [
    { key: "productName", header: "Sản phẩm", cell: (r) => <span className="font-medium">{r.productName || r.name}</span> },
    { key: "totalQuantitySold", header: "Đã bán", cell: (r) => <span className="font-bold">{r.totalQuantitySold ?? r.quantity ?? r.totalSold ?? 0}</span> },
    { key: "totalRevenue", header: "Tổng doanh thu", cell: (r) => <span className="font-bold text-black">{formatVND(r.totalRevenue ?? r.revenue)}</span> },
  ];

  // Top Customers Columns
  const customerColumns: Column<any>[] = [
    { key: "customerName", header: "Khách hàng", cell: (r) => <span className="font-medium">{r.customerName || r.fullName}</span> },
    { key: "customerEmail", header: "Email", cell: (r) => <span className="font-mono text-xs text-zinc-600">{r.customerEmail || r.email}</span> },
    { key: "totalOrders", header: "Số đơn hàng", cell: (r) => <span className="font-bold">{r.totalOrders ?? r.orderCount ?? 0}</span> },
    { key: "totalSpent", header: "Tổng chi tiêu", cell: (r) => <span className="font-bold text-black">{formatVND(r.totalSpent || r.revenue)}</span> },
  ];


  // Low Stock Columns
  const lowStockColumns: Column<any>[] = [
    { key: "sku", header: "SKU", cell: (r) => <span className="font-mono text-xs font-bold">{r.sku}</span> },
    { key: "productName", header: "Sản phẩm", cell: (r) => <span className="font-medium">{r.productName}</span> },
    { key: "stock", header: "Tồn kho", cell: (r) => <span className="font-bold text-red-600 border border-red-600 bg-red-50 px-2 py-0.5">{r.stock}</span> },
  ];

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-black pb-5">
        <div>
          <h1 className="text-[28px] font-medium tracking-tight">Báo cáo & Thống kê</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Tổng hợp dữ liệu doanh thu, sản phẩm bán chạy, nhóm khách hàng VIP và tình trạng tồn kho.
          </p>
        </div>

        <DateRangePicker value={range} onChange={setRange} />
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap border-b border-black">
        {[
          ["revenue", "Doanh thu", TrendingUp],
          ["products", "Sản phẩm bán chạy", Package],
          ["customers", "Khách hàng VIP", Users],
          ["status", "Trạng thái đơn hàng", BarChart3],
          ["inventory", "Cảnh báo tồn kho", AlertTriangle],
        ].map(([key, label, Icon]: any) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-r border-black transition-colors ${
              activeTab === key ? "bg-black text-white" : "bg-white text-black hover:bg-zinc-100"
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab 1: Revenue Chart */}
      {activeTab === "revenue" && (
        <div className="border border-black bg-white p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-black pb-4">
            <h3 className="text-xl font-medium">Biểu đồ doanh thu</h3>
            <div className="flex items-center gap-2 text-sm font-medium">
              <span>Gom nhóm theo:</span>
              {(["day", "week", "month"] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setGroupBy(g)}
                  className={`px-3 py-1 border border-black uppercase text-xs ${
                    groupBy === g ? "bg-black text-white" : "bg-white hover:bg-zinc-100"
                  }`}
                >
                  {g === "day" ? "Ngày" : g === "week" ? "Tuần" : "Tháng"}
                </button>
              ))}
            </div>
          </div>

          <div className="h-64 flex items-end gap-2 pt-8 pb-2 border-b border-zinc-200">
            {revenueQuery.isLoading ? (
              <p className="text-sm text-zinc-500">Đang tải dữ liệu doanh thu...</p>
            ) : revenueList.length ? (
              revenueList.map((item, index) => {
                const rev = Number(item.totalAmount ?? item.totalRevenue ?? item.revenue ?? item.total ?? 0);
                const heightPercent = Math.max(4, (rev / maxRevenue) * 100);
                return (
                  <div key={index} className="flex-1 h-full flex flex-col justify-end items-center group relative">
                    <div className="text-[10px] font-mono font-semibold text-zinc-800 opacity-0 group-hover:opacity-100 transition-opacity absolute -top-6 bg-white px-1.5 py-0.5 border border-zinc-300 rounded shadow-xs z-10 whitespace-nowrap">
                      {formatVND(rev)}
                    </div>
                    <div className="w-full flex-1 flex items-end bg-zinc-50 rounded-t overflow-hidden">
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className="w-full bg-zinc-900 group-hover:bg-emerald-600 transition-all rounded-t"
                      />
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500 truncate w-full text-center mt-1.5">
                      {item.period || item.date || item.label || index + 1}
                    </span>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-zinc-500">Chưa có dữ liệu doanh thu cho mốc thời gian này.</p>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Top Products */}
      {activeTab === "products" && (
        <DataTable
          columns={productColumns}
          rows={Array.isArray(topProductsData) ? topProductsData : topProductsData.content || []}
          loading={topProductsQuery.isLoading}
          rowKey={(r) => r.id || r.sku || Math.random()}
          empty="Chưa có dữ liệu sản phẩm bán chạy."
        />
      )}

      {/* Tab 3: Top Customers */}
      {activeTab === "customers" && (
        <DataTable
          columns={customerColumns}
          rows={Array.isArray(topCustomersData) ? topCustomersData : topCustomersData.content || []}
          loading={topCustomersQuery.isLoading}
          rowKey={(r) => r.id || r.email || Math.random()}
          empty="Chưa có dữ liệu khách hàng VIP."
        />
      )}

      {/* Tab 4: Order Status Summary */}
      {activeTab === "status" && (
        <div className="border border-black bg-white p-6">
          <h3 className="text-xl font-medium mb-6">Tóm tắt đơn hàng theo trạng thái</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(Array.isArray(orderStatusData) ? orderStatusData : orderStatusData.content || []).map((item: any) => (
              <div key={item.status} className="border border-black p-5 space-y-2 bg-zinc-50">
                <StatusBadge status={item.status} />
                <p className="text-3xl font-bold tracking-tight text-black">{item.count ?? item.quantity ?? 0}</p>
                <p className="text-xs text-zinc-500">
                  Doanh thu: <strong>{formatVND(item.revenue ?? 0)}</strong>
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Low Stock */}
      {activeTab === "inventory" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">Ngưỡng tồn kho tối thiểu:</span>
            <input
              type="number"
              value={lowStockThreshold}
              onChange={(e) => setLowStockThreshold(Number(e.target.value))}
              className="border border-black px-3 py-1 text-sm w-24"
            />
          </div>
          <DataTable
            columns={lowStockColumns}
            rows={Array.isArray(lowStockData) ? lowStockData : lowStockData.content || []}
            loading={lowStockQuery.isLoading}
            rowKey={(r) => r.id || r.sku}
            empty="Tất cả sản phẩm đều đủ tồn kho."
          />
        </div>
      )}
    </section>
  );
}
