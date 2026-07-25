"use client";

import { useQuery } from "@tanstack/react-query";
import http from "@/lib/http";

type BusinessReport = {
  summary: {
    netRevenue: number;
    grossSales: number;
    discounts: number;
    averageOrderValue: number;
    cancelledOrders: number;
    totalOrders: number;
  };
  topProducts: Array<{
    productName: string;
    sku: string;
    quantity: number;
    revenue: number;
  }>;
};

export default function BusinessReportPage() {
  const { data, isLoading } = useQuery<BusinessReport>({
    queryKey: ["admin-reports-business"],
    queryFn: async () => {
      const res = await http.get("/admin/reports/business");
      return (res as any).data;
    },
  });

  const handleExportCsv = () => {
    window.open(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1"}/admin/reports/business/export`, "_blank");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Báo cáo Kinh doanh</h1>
          <p className="text-sm text-slate-500">Phân tích Doanh thu thuần (Net Revenue), Doanh số gộp, AOV và hiệu quả sản phẩm.</p>
        </div>
        <button
          onClick={handleExportCsv}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg shadow-xs flex items-center gap-2"
        >
          📥 Xuất báo cáo CSV
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase">Doanh Thu Thuần (Net)</p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">
            {new Intl.NumberFormat("vi-VN").format(data?.summary?.netRevenue ?? 0)} VNĐ
          </p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase">Tổng Giảm Giá / Promotion</p>
          <p className="mt-2 text-2xl font-bold text-amber-600">
            {new Intl.NumberFormat("vi-VN").format(data?.summary?.discounts ?? 0)} VNĐ
          </p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase">Giá Trị Đơn Trung Bình (AOV)</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {new Intl.NumberFormat("vi-VN").format(data?.summary?.averageOrderValue ?? 0)} VNĐ
          </p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase">Tổng Đơn / Tỷ lệ Hủy</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {data?.summary?.totalOrders ?? 0} <span className="text-sm font-normal text-red-600">({data?.summary?.cancelledOrders ?? 0} đã hủy)</span>
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b bg-slate-50">
          <h3 className="font-bold text-slate-900 text-base">Top Sản Phẩm Doanh Thu Cao Nhất</h3>
        </div>
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-100 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="px-6 py-3">Tên sản phẩm</th>
              <th className="px-6 py-3">Mã SKU</th>
              <th className="px-6 py-3">Số lượng bán</th>
              <th className="px-6 py-3">Doanh thu mang về</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {isLoading ? (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-400">Đang tải báo cáo...</td></tr>
            ) : data?.topProducts?.length ? (
              data.topProducts.map((p, idx) => (
                <tr key={`${p.sku}-${idx}`} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-semibold text-slate-900">{p.productName}</td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-600">{p.sku}</td>
                  <td className="px-6 py-4">{p.quantity} sản phẩm</td>
                  <td className="px-6 py-4 font-bold text-emerald-600">{new Intl.NumberFormat("vi-VN").format(p.revenue)} VNĐ</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-400">Chưa có dữ liệu bán hàng.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
