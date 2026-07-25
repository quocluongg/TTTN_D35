"use client";

import { useQuery } from "@tanstack/react-query";
import http from "@/lib/http";

type Api<T> = { success: boolean; data: T };
type Dashboard = { revenue: number; orders: number; newCustomers: number; lowStock: number; topProducts: Array<{ productname?: string; productName?: string; quantity: number; revenue: number }> };

const money = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });

export default function AdminPage() {
  const dashboard = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: async () => (await http.get("/admin/reports/dashboard") as Api<Dashboard>).data,
  });
  const users = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => (await http.get("/admin/users?size=5") as Api<{ items: Array<{ id: string; fullName: string; email: string; role: string; active: boolean }> }>).data,
  });

  if (dashboard.isLoading) return <main className="min-h-screen p-8">Đang tải bảng điều khiển…</main>;
  if (dashboard.isError) return <main className="min-h-screen p-8 text-red-600">Không thể tải dữ liệu. Hãy kiểm tra quyền REPORT_VIEW.</main>;
  const data = dashboard.data!;
  const cards = [
    ["Doanh thu hoàn tất", money.format(Number(data.revenue ?? 0))],
    ["Đơn hàng", String(data.orders ?? 0)],
    ["Khách hàng mới", String(data.newCustomers ?? 0)],
    ["Sản phẩm sắp hết", String(data.lowStock ?? 0)],
  ];
  return <main className="min-h-screen bg-slate-50 p-6 text-slate-900 md:p-10">
    <header className="mb-8 flex flex-wrap items-end justify-between gap-3">
      <div><p className="text-sm font-medium text-lime-700">SHOPWISE / QUẢN TRỊ</p><h1 className="text-3xl font-bold">Tổng quan vận hành</h1></div>
      <nav className="flex flex-wrap gap-3 text-sm"><a href="/admin/reports/users" className="underline">Báo cáo người dùng</a><a href="/admin/reports/business" className="underline">Báo cáo kinh doanh</a><a href="/admin/operations" className="underline">Vận hành</a></nav>
    </header>
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(([label, value]) => <article key={label} className="rounded-xl border bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></article>)}
    </section>
    <section className="mt-8 grid gap-6 lg:grid-cols-2">
      <article className="rounded-xl border bg-white p-5"><h2 className="text-lg font-semibold">Sản phẩm bán chạy</h2><div className="mt-4 space-y-3">{(data.topProducts ?? []).length ? data.topProducts.map((item, i) => <div key={`${item.productName}-${i}`} className="flex justify-between border-b pb-2"><span>{item.productName ?? item.productname}</span><span>{item.quantity} sản phẩm</span></div>) : <p className="text-slate-500">Chưa có đơn giao thành công trong kỳ.</p>}</div></article>
      <article className="rounded-xl border bg-white p-5"><h2 className="text-lg font-semibold">Tài khoản mới nhất</h2><div className="mt-4 space-y-3">{users.data?.items?.map(user => <div key={user.id} className="flex justify-between border-b pb-2"><span><b>{user.fullName}</b><br/><small>{user.email}</small></span><span className={user.active ? "text-emerald-700" : "text-red-700"}>{user.role}</span></div>) ?? <p className="text-slate-500">Đang tải…</p>}</div></article>
    </section>
  </main>;
}
