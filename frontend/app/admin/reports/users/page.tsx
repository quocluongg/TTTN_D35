"use client";

import { useQuery } from "@tanstack/react-query";
import http from "@/lib/http";

type UserReport = {
  summary: {
    total: number;
    active: number;
    locked: number;
    unverified: number;
  };
  topCustomers: Array<{
    id: string;
    fullName: string;
    email: string;
    completedOrders: number;
    revenue: number;
    averageOrderValue: number;
    lastPurchaseAt: string;
  }>;
};

export default function UserReportPage() {
  const { data, isLoading } = useQuery<UserReport>({
    queryKey: ["admin-reports-users"],
    queryFn: async () => {
      const res = await http.get("/admin/reports/users");
      return (res as any).data;
    },
  });

  const handleExportCsv = () => {
    window.open(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1"}/admin/reports/users/export`, "_blank");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Báo cáo Người dùng</h1>
          <p className="text-sm text-slate-500">Phân tích tăng trưởng người dùng, tỷ lệ tài khoản và Top khách hàng giá trị cao.</p>
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
          <p className="text-xs font-semibold text-slate-500 uppercase">Tổng Tài Khoản</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{data?.summary?.total ?? 0}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase">Đang Hoạt Động</p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">{data?.summary?.active ?? 0}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase">Đã Khóa</p>
          <p className="mt-2 text-2xl font-bold text-red-600">{data?.summary?.locked ?? 0}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase">Chưa Xác Thực Email</p>
          <p className="mt-2 text-2xl font-bold text-amber-600">{data?.summary?.unverified ?? 0}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b bg-slate-50">
          <h3 className="font-bold text-slate-900 text-base">Top Khách Hàng Doanh Thu Cao Nhất (VIPs)</h3>
        </div>
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-100 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="px-6 py-3">Khách hàng</th>
              <th className="px-6 py-3">Email</th>
              <th className="px-6 py-3">Đơn hoàn tất</th>
              <th className="px-6 py-3">Tổng giá trị mua</th>
              <th className="px-6 py-3">Giá trị đơn TB (AOV)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {isLoading ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">Đang tải báo cáo...</td></tr>
            ) : data?.topCustomers?.length ? (
              data.topCustomers.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-semibold text-slate-900">{c.fullName}</td>
                  <td className="px-6 py-4 text-slate-600">{c.email}</td>
                  <td className="px-6 py-4">{c.completedOrders} đơn</td>
                  <td className="px-6 py-4 font-bold text-emerald-600">{new Intl.NumberFormat("vi-VN").format(c.revenue)} VNĐ</td>
                  <td className="px-6 py-4 font-semibold">{new Intl.NumberFormat("vi-VN").format(c.averageOrderValue)} VNĐ</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">Chưa có dữ liệu khách hàng VIP.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
