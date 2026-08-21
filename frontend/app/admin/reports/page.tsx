"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { adminApi } from "@/services/admin";
import DateRangePicker, { type DateRange } from "@/components/DateRangePicker";
import StatusBadge from "@/components/StatusBadge";
import {
  BarChart3,
  TrendingUp,
  Users,
  Package,
  AlertTriangle,
  RefreshCw,
  Download,
  DollarSign,
  ShoppingBag,
  Award,
  ArrowUpRight,
  ExternalLink,
  ChevronRight,
  Filter,
  Layers
} from "lucide-react";

const unwrap = (x: any) => x?.data ?? x;

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<"revenue" | "products" | "customers" | "status" | "inventory">("revenue");
  const [range, setRange] = useState<DateRange>({ from: "", to: "" });
  const [groupBy, setGroupBy] = useState<"day" | "week" | "month">("day");
  const [lowStockThreshold, setLowStockThreshold] = useState(10);

  const cleanParams = {
    from: range.from ? `${range.from}T00:00:00` : undefined,
    to: range.to ? `${range.to}T23:59:59` : undefined,
  };

  // Reports Queries
  const revenueQuery = useQuery({
    queryKey: ["report-revenue", cleanParams, groupBy],
    queryFn: () => adminApi.reports.revenue({ ...cleanParams, groupBy }),
  });

  const topProductsQuery = useQuery({
    queryKey: ["report-top-products", cleanParams],
    queryFn: () => adminApi.reports.topProducts({ ...cleanParams, limit: 10 }),
  });

  const topCustomersQuery = useQuery({
    queryKey: ["report-top-customers", cleanParams],
    queryFn: () => adminApi.reports.topCustomers({ ...cleanParams, limit: 10 }),
  });

  const orderStatusQuery = useQuery({
    queryKey: ["report-order-status", cleanParams],
    queryFn: () => adminApi.reports.orderStatus({ ...cleanParams }),
  });

  const lowStockQuery = useQuery({
    queryKey: ["report-low-stock", lowStockThreshold],
    queryFn: () => adminApi.reports.lowStock({ threshold: lowStockThreshold }),
  });

  const dataRows = (x: any) => (Array.isArray(x) ? x : x?.content ?? []);

  const revenueList = dataRows(unwrap(revenueQuery.data));
  const topProductRows = dataRows(unwrap(topProductsQuery.data));
  const topCustomerRows = dataRows(unwrap(topCustomersQuery.data));
  const orderStatusRows = dataRows(unwrap(orderStatusQuery.data));
  const lowStockRows = dataRows(unwrap(lowStockQuery.data));

  const formatVND = (val: number) => Number(val || 0).toLocaleString("vi-VN") + " ₫";

  // Summary Metrics
  const rawRevenue = revenueList.reduce(
    (sum: number, item: any) => sum + Number(item.totalAmount ?? item.revenue ?? item.total ?? 0),
    0
  );
  const maxRevenue = Math.max(1, ...revenueList.map((item: any) => Number(item.totalAmount ?? item.revenue ?? 0)));
  const totalQuantitySold = topProductRows.reduce(
    (sum: number, item: any) => sum + Number(item.totalQuantitySold ?? item.quantity ?? 0),
    0
  );
  const totalOrdersCount = orderStatusRows.reduce(
    (sum: number, item: any) => sum + Number(item.count ?? 0),
    0
  );

  const handleExportCSV = () => {
    let csvData = "";
    let fileName = `Bao_Cao_${activeTab}_${new Date().toISOString().slice(0, 10)}.csv`;

    if (activeTab === "revenue") {
      csvData = "Moc thoi gian,Doanh thu (VND),So don hang\n" +
        revenueList.map((r: any) => `"${r.period || r.date}",${r.totalAmount || r.revenue || 0},${r.orderCount || 1}`).join("\n");
    } else if (activeTab === "products") {
      csvData = "Ten san pham,So luong da ban,Tong doanh thu (VND)\n" +
        topProductRows.map((r: any) => `"${r.productName || r.name}",${r.totalQuantitySold || 0},${r.totalRevenue || 0}`).join("\n");
    } else if (activeTab === "customers") {
      csvData = "Ten khach hang,Email,So don hang,Tong chi tiêu (VND)\n" +
        topCustomerRows.map((r: any) => `"${r.customerName || r.fullName}","${r.customerEmail || r.email}",${r.totalOrders || 0},${r.totalSpent || 0}`).join("\n");
    } else if (activeTab === "status") {
      csvData = "Trang thai,So don hang,Tong doanh thu (VND)\n" +
        orderStatusRows.map((r: any) => `"${r.status}",${r.count || 0},${r.revenue || 0}`).join("\n");
    } else if (activeTab === "inventory") {
      csvData = "Mã SKU,Ten san pham,Ton kho hien tai\n" +
        lowStockRows.map((r: any) => `"${r.sku}","${r.productName}",${r.stock || 0}`).join("\n");
    }

    const encodedUri = encodeURI("data:text/csv;charset=utf-8,\uFEFF" + csvData);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRefetch = () => {
    if (activeTab === "revenue") revenueQuery.refetch();
    if (activeTab === "products") topProductsQuery.refetch();
    if (activeTab === "customers") topCustomersQuery.refetch();
    if (activeTab === "status") orderStatusQuery.refetch();
    if (activeTab === "inventory") lowStockQuery.refetch();
  };

  const TABS_CONFIG = [
    { key: "revenue", label: "Doanh Thu (Line Chart)", icon: TrendingUp },
    { key: "products", label: "Top Sản Phẩm Bán Chạy", icon: Package },
    { key: "customers", label: "Khách Hàng VIP", icon: Users },
    { key: "status", label: "Trạng Thái Đơn Hàng", icon: BarChart3 },
    { key: "inventory", label: "Cảnh Báo Tồn Kho", icon: AlertTriangle },
  ] as const;

  return (
    <section className="space-y-6 font-sans pb-10">
      {/* 1. Header & Global Date Range Filter */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-zinc-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
            <BarChart3 size={24} className="text-zinc-700" /> Báo Cáo & Thống Kê Kinh Doanh
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Phân tích số liệu doanh thu thời gian thực, top sản phẩm bán chạy, khách hàng VIP & tồn kho
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <DateRangePicker value={range} onChange={setRange} />
          <button
            onClick={handleRefetch}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 text-zinc-700 shadow-xs transition-all"
          >
            <RefreshCw size={14} className="text-zinc-500" /> Làm mới
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 shadow-xs transition-all cursor-pointer"
          >
            <Download size={14} /> Xuất File CSV
          </button>
        </div>
      </div>

      {/* 2. Top Summary KPI Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Card 1: Doanh thu */}
        <div className="p-5 rounded-2xl border border-zinc-200 bg-white shadow-xs space-y-2">
          <div className="flex justify-between items-center text-xs text-zinc-500 font-medium">
            <span>Tổng Doanh Thu Lọc</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <DollarSign size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-zinc-900 tracking-tight font-mono">
            {formatVND(rawRevenue)}
          </p>
          <p className="text-xs text-zinc-500">Ghi nhận từ các đơn COMPLETED & PAID</p>
        </div>

        {/* Card 2: Sản phẩm bán */}
        <div className="p-5 rounded-2xl border border-zinc-200 bg-white shadow-xs space-y-2">
          <div className="flex justify-between items-center text-xs text-zinc-500 font-medium">
            <span>Sản Phẩm Đã Bán</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Package size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-zinc-900 tracking-tight font-mono">
            {totalQuantitySold} món
          </p>
          <p className="text-xs text-zinc-500">Từ top 10 sản phẩm bán chạy nhất</p>
        </div>

        {/* Card 3: Tổng đơn hàng */}
        <div className="p-5 rounded-2xl border border-zinc-200 bg-white shadow-xs space-y-2">
          <div className="flex justify-between items-center text-xs text-zinc-500 font-medium">
            <span>Tổng Đơn Hàng</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
              <ShoppingBag size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-zinc-900 tracking-tight font-mono">
            {totalOrdersCount} đơn
          </p>
          <p className="text-xs text-zinc-500">Phân bố trên tất cả trạng thái</p>
        </div>

        {/* Card 4: Tồn kho thấp */}
        <div className="p-5 rounded-2xl border border-zinc-200 bg-white shadow-xs space-y-2">
          <div className="flex justify-between items-center text-xs text-zinc-500 font-medium">
            <span>Cảnh Báo Tồn Kho</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
              <AlertTriangle size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-zinc-900 tracking-tight font-mono">
            {lowStockRows.length} SP
          </p>
          <p className="text-xs text-zinc-500">Số lượng tồn nhỏ hơn hoặc bằng {lowStockThreshold}</p>
        </div>
      </div>

      {/* 3. Modern Smooth Tab Navigation */}
      <div className="bg-zinc-50 p-1.5 rounded-2xl border border-zinc-200/80 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        {TABS_CONFIG.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? "bg-white text-zinc-900 shadow-2xs border border-zinc-200/80"
                  : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/60"
              }`}
            >
              <Icon size={15} className={isActive ? "text-emerald-600" : "text-zinc-400"} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 4. TAB CONTENTS */}

      {/* TAB 1: REVENUE LINE CHART */}
      {activeTab === "revenue" && (
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <TrendingUp size={18} className="text-emerald-600" /> Biểu Đồ Doanh Thu Lọc Động
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">Biểu đồ đường SVG tương tác hiển thị biến động doanh thu theo mốc thời gian</p>
            </div>

            {/* Time Group Buttons */}
            <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl self-start sm:self-auto">
              {(["day", "week", "month"] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setGroupBy(g)}
                  className={`px-3 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                    groupBy === g ? "bg-white text-zinc-900 shadow-2xs" : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  {g === "day" ? "Theo Ngày" : g === "week" ? "Theo Tuần" : "Theo Tháng"}
                </button>
              ))}
            </div>
          </div>

          {/* SVG Line Chart */}
          <div className="pt-2 pb-1 border-b border-zinc-100">
            {revenueQuery.isLoading ? (
              <div className="w-full h-64 flex items-center justify-center text-xs text-zinc-400 font-mono">
                <RefreshCw size={14} className="animate-spin mr-2" /> Đang tải biểu đồ doanh thu...
              </div>
            ) : (
              <RevenueLineChart
                revenueList={revenueList}
                maxRevenue={maxRevenue}
                formatVND={formatVND}
              />
            )}
          </div>

          {/* Chart Summary Footnote */}
          <div className="flex flex-wrap items-center justify-between text-xs text-zinc-500 pt-1">
            <span>
              Doanh thu cao nhất mốc: <strong className="text-zinc-900 font-mono">{formatVND(maxRevenue)}</strong>
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Đơn hoàn tất & đã thanh toán
            </span>
          </div>
        </div>
      )}

      {/* TAB 2: TOP PRODUCTS */}
      {activeTab === "products" && (
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <Package size={18} className="text-blue-600" /> Bảng Xếp Hạng Top 10 Sản Phẩm Bán Chạy
            </h2>
            <span className="text-xs text-zinc-500 font-mono">Lọc từ cơ sở dữ liệu</span>
          </div>

          {topProductsQuery.isLoading ? (
            <div className="p-16 text-center text-xs text-zinc-400 font-mono flex items-center justify-center gap-2">
              <RefreshCw size={14} className="animate-spin" /> Đang tải dữ liệu sản phẩm...
            </div>
          ) : topProductRows.length === 0 ? (
            <div className="p-16 text-center text-xs text-zinc-400">Chưa có dữ liệu sản phẩm bán chạy trong khoảng thời gian này.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-zinc-50/80 border-b border-zinc-200 font-semibold text-zinc-500 text-[11px] uppercase tracking-wider">
                    <th className="p-4 w-16 text-center">Thứ Hạng</th>
                    <th className="p-4">Tên Sản Phẩm</th>
                    <th className="p-4 text-center">Số Lượng Đã Bán</th>
                    <th className="p-4 text-right">Tổng Doanh Thu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {topProductRows.map((p: any, idx: number) => {
                    const sold = Number(p.totalQuantitySold ?? p.quantity ?? 0);
                    const rev = Number(p.totalRevenue ?? p.revenue ?? 0);
                    return (
                      <tr key={p.productId || idx} className="hover:bg-zinc-50/80 transition-colors">
                        <td className="p-4 text-center font-bold font-mono">
                          <span className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-xs ${
                            idx === 0
                              ? "bg-amber-100 text-amber-800"
                              : idx === 1
                              ? "bg-zinc-200 text-zinc-700"
                              : idx === 2
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-zinc-50 text-zinc-500"
                          }`}>
                            {idx + 1}
                          </span>
                        </td>
                        <td className="p-4 font-semibold text-zinc-900 text-sm">
                          {p.productName || p.name}
                        </td>
                        <td className="p-4 text-center font-bold font-mono text-zinc-800">
                          {sold} SP
                        </td>
                        <td className="p-4 text-right font-bold font-mono text-emerald-600 text-sm">
                          {formatVND(rev)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: TOP CUSTOMERS */}
      {activeTab === "customers" && (
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <Award size={18} className="text-amber-500" /> Bảng Xếp Hạng Khách Hàng Thân Thiết (VIP)
            </h2>
            <span className="text-xs text-zinc-500 font-mono">Lọc theo tổng mức chi tiêu</span>
          </div>

          {topCustomersQuery.isLoading ? (
            <div className="p-16 text-center text-xs text-zinc-400 font-mono flex items-center justify-center gap-2">
              <RefreshCw size={14} className="animate-spin" /> Đang tải danh sách khách hàng...
            </div>
          ) : topCustomerRows.length === 0 ? (
            <div className="p-16 text-center text-xs text-zinc-400">Chưa có dữ liệu khách hàng chi tiêu trong khoảng thời gian này.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-zinc-50/80 border-b border-zinc-200 font-semibold text-zinc-500 text-[11px] uppercase tracking-wider">
                    <th className="p-4 w-16 text-center">Hạng</th>
                    <th className="p-4">Khách Hàng</th>
                    <th className="p-4">Email</th>
                    <th className="p-4 text-center">Số Đơn Hàng</th>
                    <th className="p-4 text-right">Tổng Chi Tiêu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {topCustomerRows.map((c: any, idx: number) => {
                    const spent = Number(c.totalSpent ?? c.revenue ?? 0);
                    const orders = Number(c.totalOrders ?? c.orderCount ?? 0);
                    const initial = (c.customerName || c.fullName || "U").substring(0, 1).toUpperCase();

                    return (
                      <tr key={c.customerId || c.email || idx} className="hover:bg-zinc-50/80 transition-colors">
                        <td className="p-4 text-center font-bold font-mono">
                          <span className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-xs ${
                            idx === 0
                              ? "bg-amber-100 text-amber-800"
                              : idx === 1
                              ? "bg-zinc-200 text-zinc-700"
                              : idx === 2
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-zinc-50 text-zinc-500"
                          }`}>
                            {idx + 1}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-zinc-100 text-zinc-700 font-bold flex items-center justify-center text-xs">
                              {initial}
                            </div>
                            <span className="font-semibold text-zinc-900">{c.customerName || c.fullName || "—"}</span>
                          </div>
                        </td>
                        <td className="p-4 font-mono text-zinc-500">{c.customerEmail || c.email || "—"}</td>
                        <td className="p-4 text-center font-bold font-mono text-zinc-800">{orders} đơn</td>
                        <td className="p-4 text-right font-bold font-mono text-emerald-600 text-sm">{formatVND(spent)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: ORDER STATUS SUMMARY */}
      {activeTab === "status" && (
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
            <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
              <BarChart3 size={18} className="text-purple-600" /> Tóm Tắt Đơn Hàng Theo Trạng Thái
            </h2>
            <span className="text-xs text-zinc-500 font-mono font-bold">{totalOrdersCount} tổng đơn</span>
          </div>

          {orderStatusQuery.isLoading ? (
            <div className="p-16 text-center text-xs text-zinc-400 font-mono flex items-center justify-center gap-2">
              <RefreshCw size={14} className="animate-spin" /> Đang tải dữ liệu đơn hàng...
            </div>
          ) : orderStatusRows.length === 0 ? (
            <div className="p-16 text-center text-xs text-zinc-400">Chưa có dữ liệu trạng thái đơn hàng.</div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {orderStatusRows.map((item: any) => {
                const cnt = Number(item.count ?? item.quantity ?? 0);
                const rev = Number(item.revenue ?? 0);
                const pct = totalOrdersCount > 0 ? ((cnt / totalOrdersCount) * 100).toFixed(0) : "0";

                return (
                  <div key={item.status} className="p-5 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-3">
                    <div className="flex justify-between items-center">
                      <StatusBadge status={item.status} />
                      <span className="text-xs font-mono font-semibold text-zinc-400">{pct}%</span>
                    </div>

                    <div>
                      <p className="text-3xl font-bold font-mono text-zinc-900 tracking-tight">{cnt} đơn</p>
                      <p className="text-xs text-zinc-500 mt-1">
                        Doanh thu: <strong className="text-zinc-800 font-mono">{formatVND(rev)}</strong>
                      </p>
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
      )}

      {/* TAB 5: LOW STOCK ALERT */}
      {activeTab === "inventory" && (
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber-500" /> Cảnh Báo Tồn Kho Thấp & Cần Nhập Kho
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">Danh sách sản phẩm/biến thể có số lượng còn lại dưới ngưỡng thiết lập</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-600">Ngưỡng tối thiểu:</span>
              <input
                type="number"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(Number(e.target.value))}
                className="w-20 border border-zinc-200 px-3 py-1.5 text-xs font-mono rounded-xl bg-zinc-50 text-center focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>
          </div>

          {lowStockQuery.isLoading ? (
            <div className="p-16 text-center text-xs text-zinc-400 font-mono flex items-center justify-center gap-2">
              <RefreshCw size={14} className="animate-spin" /> Đang tải danh sách cảnh báo tồn kho...
            </div>
          ) : lowStockRows.length === 0 ? (
            <div className="p-16 text-center text-xs text-emerald-600 font-medium">Tất cả sản phẩm đều đủ tồn kho (lớn hơn {lowStockThreshold} sản phẩm).</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-zinc-50/80 border-b border-zinc-200 font-semibold text-zinc-500 text-[11px] uppercase tracking-wider">
                    <th className="p-4">Mã SKU</th>
                    <th className="p-4">Tên Sản Phẩm</th>
                    <th className="p-4 text-center">Tồn Kho Hiện Tại</th>
                    <th className="p-4 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {lowStockRows.map((r: any, idx: number) => (
                    <tr key={r.id || r.sku || idx} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="p-4 font-mono font-bold text-zinc-700">{r.sku}</td>
                      <td className="p-4 font-semibold text-zinc-900">{r.productName}</td>
                      <td className="p-4 text-center">
                        <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-bold font-mono text-xs border border-amber-200">
                          Còn {r.stockQuantity ?? r.stock ?? 0} SP
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <Link
                          href="/admin/inventory"
                          className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1 cursor-pointer"
                        >
                          Nhập Kho <ExternalLink size={12} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
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

  const width = 800;
  const height = 240;
  const padding = { top: 25, right: 25, bottom: 40, left: 75 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const points = revenueList.map((item: any, i: number) => {
    const rev = Number(item.totalAmount ?? item.totalRevenue ?? item.revenue ?? item.total ?? 0);
    const x =
      revenueList.length === 1
        ? padding.left + chartW / 2
        : padding.left + (i / (revenueList.length - 1)) * chartW;
    const y = padding.top + chartH - (maxRevenue > 0 ? (rev / maxRevenue) * chartH : 0);
    return {
      x,
      y,
      rev,
      period: item.period || item.date || item.label || `${i + 1}`,
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
        <div className="flex items-center justify-between text-xs px-3.5 py-2 bg-emerald-50/80 text-emerald-900 border border-emerald-200/80 rounded-xl">
          <span className="font-medium text-emerald-800">Mốc {activePt.period}:</span>
          <span className="font-bold font-mono text-emerald-700">
            {formatVND(activePt.rev)} ({activePt.orderCount} đơn hàng)
          </span>
        </div>
      )}

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible select-none">
        <defs>
          <linearGradient id="reportsRevenueGradient" x1="0" y1="0" x2="0" y2="1">
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
        <path d={areaPath} fill="url(#reportsRevenueGradient)" />

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

