"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Eye,
  ShoppingCart,
  Package,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Sparkles,
  Database,
  Layers,
  FileCheck
} from "lucide-react";
import TailAdminRevenueChart from "@/components/adminjs/TailAdminRevenueChart";

type RecentOrder = {
  id: string;
  customerName: string;
  customerEmail: string;
  productName: string;
  amount: number;
  date: string;
  status: "PAID" | "PENDING" | "DELIVERED" | "CANCELLED";
};

type CrawledStats = {
  bronzeRecords: number;
  silverRecords: number;
  goldDocuments: number;
  goldChunks: number;
  lastIngestedAt: string;
};

const MOCK_RECENT_ORDERS: RecentOrder[] = [
  {
    id: "SW-89412",
    customerName: "Nguyễn Văn Hùng",
    customerEmail: "hung.nguyen@gmail.com",
    productName: "iPhone 15 Pro Max 256GB - VN/A",
    amount: 29490000,
    date: "28/07/2026",
    status: "PAID",
  },
  {
    id: "SW-89413",
    customerName: "Trần Thị Mai",
    customerEmail: "mai.tran@dientu.vn",
    productName: "Laptop Acer Aspire 3 A315",
    amount: 12500000,
    date: "28/07/2026",
    status: "DELIVERED",
  },
  {
    id: "SW-89414",
    customerName: "Lê Hoàng Nam",
    customerEmail: "nam.le@kythuat.com",
    productName: "Tai nghe Bluetooth Baseus Bowie EZ10",
    amount: 350000,
    date: "27/07/2026",
    status: "PENDING",
  },
  {
    id: "SW-89415",
    customerName: "Phạm Quốc Tuấn",
    customerEmail: "tuan.pham@congnghe.org",
    productName: "Robot hút bụi Roborock Q Revo",
    amount: 13850000,
    date: "26/07/2026",
    status: "PAID",
  },
];

const TOP_CHANNELS = [
  { name: "Tìm kiếm trực tiếp (Google SEO)", visitors: "3.5K", revenues: "68.4tr", percent: "48%" },
  { name: "Khách hàng giới thiệu (Referral)", visitors: "1.8K", revenues: "32.1tr", percent: "25%" },
  { name: "Tư vấn AI Data Engine", visitors: "1.2K", revenues: "24.6tr", percent: "18%" },
  { name: "Mạng xã hội (Facebook / Zalo)", visitors: "650", revenues: "12.8tr", percent: "9%" },
];

export default function AdminDashboardPage() {
  const [crawledStats, setCrawledStats] = useState<CrawledStats | null>(null);

  useEffect(() => {
    fetch("/api/admin/crawled-stats")
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success) {
          setCrawledStats(resData.data);
        }
      })
      .catch((err) => console.error("Lỗi khi tải crawled stats:", err));
  }, []);

  return (
    <div className="space-y-6">
      {/* 4 TailAdmin KPI Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Stat Card 1: Total Views / Revenue */}
        <div className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#2E3A47] p-5 rounded-xl shadow-xs transition-colors">
          <div className="w-11 h-11 rounded-full bg-[#EFF4FB] dark:bg-[#24303F] text-[#3C50E0] dark:text-[#80CAEE] flex items-center justify-center mb-4">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-2xl font-bold text-[#1C2434] dark:text-white tracking-tight">145.8M VNĐ</h4>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-[#64748B] dark:text-[#8A99AD] font-medium">Tổng Doanh Thu</span>
              <span className="inline-flex items-center gap-0.5 text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                0.43%
                <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </div>

        {/* Stat Card 2: Total Profit / Orders */}
        <div className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#2E3A47] p-5 rounded-xl shadow-xs transition-colors">
          <div className="w-11 h-11 rounded-full bg-[#EFF4FB] dark:bg-[#24303F] text-[#3C50E0] dark:text-[#80CAEE] flex items-center justify-center mb-4">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-2xl font-bold text-[#1C2434] dark:text-white tracking-tight">124 đơn</h4>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-[#64748B] dark:text-[#8A99AD] font-medium">Đơn Hàng Đã Xử Lý</span>
              <span className="inline-flex items-center gap-0.5 text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                4.35%
                <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </div>

        {/* Stat Card 3: Total Crawled Products (REAL DATA) */}
        <div className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#2E3A47] p-5 rounded-xl shadow-xs transition-colors">
          <div className="w-11 h-11 rounded-full bg-[#EFF4FB] dark:bg-[#24303F] text-[#3C50E0] dark:text-[#80CAEE] flex items-center justify-center mb-4">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-2xl font-bold text-[#1C2434] dark:text-white tracking-tight">
              {crawledStats ? `${crawledStats.silverRecords} SP` : "100 SP"}
            </h4>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-[#64748B] dark:text-[#8A99AD] font-medium">Sản Phẩm Crawled (Silver)</span>
              <span className="inline-flex items-center gap-0.5 text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                100% Crawled
                <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </div>

        {/* Stat Card 4: Total Users */}
        <div className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#2E3A47] p-5 rounded-xl shadow-xs transition-colors">
          <div className="w-11 h-11 rounded-full bg-[#EFF4FB] dark:bg-[#24303F] text-[#3C50E0] dark:text-[#80CAEE] flex items-center justify-center mb-4">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-2xl font-bold text-[#1C2434] dark:text-white tracking-tight">3,456</h4>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-[#64748B] dark:text-[#8A99AD] font-medium">Khách Hàng Đăng Ký</span>
              <span className="inline-flex items-center gap-0.5 text-xs font-extrabold text-rose-600 dark:text-rose-400">
                0.95%
                <ArrowDownRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Live Data Pipeline Monitor Card */}
      <div className="bg-linear-to-r from-[#1C2434] to-[#24303F] p-5 rounded-xl text-white shadow-md border border-[#2E3A47] flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#3C50E0] rounded-xl text-white">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm">Medallion Data Crawl Status</h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                CONNECTED LIVE
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Dữ liệu sản phẩm điện tử đã crawl từ CellphoneS (Bronze) và làm sạch vào kho Silver/Gold.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 text-xs border-t md:border-t-0 md:border-l border-slate-700 pt-3 md:pt-0 md:pl-6 w-full md:w-auto justify-between md:justify-start">
          <div>
            <p className="text-slate-400 text-[11px]">Bronze Layer</p>
            <p className="font-mono font-bold text-amber-400">{crawledStats?.bronzeRecords || 100} Raw Json</p>
          </div>
          <div>
            <p className="text-slate-400 text-[11px]">Silver Layer</p>
            <p className="font-mono font-bold text-emerald-400">{crawledStats?.silverRecords || 100} Cleaned SP</p>
          </div>
          <div>
            <p className="text-slate-400 text-[11px]">Gold Vectors</p>
            <p className="font-mono font-bold text-sky-400">{crawledStats?.goldChunks || 500} FAISS Chunks</p>
          </div>
          <Link
            href="/admin/products"
            className="px-3 py-1.5 bg-[#3C50E0] text-white font-bold rounded-lg text-xs hover:bg-[#3C50E0]/90 transition"
          >
            Mở Crawled Products
          </Link>
        </div>
      </div>

      {/* Main Charts & Analytics Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* TailAdmin Double Line Chart (Span 2 cols) */}
        <div className="lg:col-span-2">
          <TailAdminRevenueChart />
        </div>

        {/* Top Traffic Channels Card */}
        <div className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#2E3A47] rounded-xl p-5 shadow-xs flex flex-col justify-between transition-colors">
          <div>
            <div className="flex items-center justify-between border-b border-[#E2E8F0] dark:border-[#2E3A47] pb-4 mb-4">
              <h3 className="text-base font-bold text-[#1C2434] dark:text-white">Kênh Chuyển Đổi Doanh Thu</h3>
              <Sparkles className="w-4 h-4 text-[#3C50E0]" />
            </div>

            <div className="space-y-4">
              {TOP_CHANNELS.map((ch, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-[#1C2434] dark:text-slate-200">{ch.name}</span>
                    <span className="text-[#3C50E0] dark:text-[#80CAEE] font-mono">{ch.revenues}</span>
                  </div>
                  <div className="w-full bg-[#F1F5F9] dark:bg-[#10172A] rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-[#3C50E0] h-full rounded-full transition-all duration-500"
                      style={{ width: ch.percent }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-[#64748B] dark:text-[#8A99AD]">
                    <span>Lượt truy cập: {ch.visitors}</span>
                    <span>Tỷ trọng: {ch.percent}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-[#E2E8F0] dark:border-[#2E3A47]">
            <Link
              href="/admin/products"
              className="text-xs font-bold text-[#3C50E0] dark:text-[#80CAEE] hover:underline flex items-center justify-between"
            >
              <span>Xem toàn bộ dữ liệu Crawl</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* TailAdmin Scannable Recent Orders Data Table */}
      <div className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#2E3A47] rounded-xl overflow-hidden shadow-xs transition-colors">
        <div className="p-5 border-b border-[#E2E8F0] dark:border-[#2E3A47] flex items-center justify-between bg-white dark:bg-[#1E293B]">
          <div>
            <h3 className="text-base font-bold text-[#1C2434] dark:text-white">Đơn Hàng Vừa Giao Dịch</h3>
            <p className="text-xs text-[#64748B] dark:text-[#8A99AD]">
              Danh sách các đơn hàng mới nhất sử dụng sản phẩm điện tử crawled
            </p>
          </div>
          <Link
            href="/admin/products"
            className="text-xs font-bold text-white bg-[#3C50E0] hover:bg-[#3C50E0]/90 px-3.5 py-2 rounded-lg transition shadow-xs"
          >
            Quản Lý Sản Phẩm Crawled
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F7F9FC] dark:bg-[#24303F] border-b border-[#E2E8F0] dark:border-[#2E3A47] text-[11px] font-extrabold uppercase text-[#64748B] dark:text-[#8A99AD] tracking-wider select-none">
                <th className="px-5 py-3.5 font-bold">Mã Đơn Hàng</th>
                <th className="px-5 py-3.5 font-bold">Khách Hàng</th>
                <th className="px-5 py-3.5 font-bold">Sản Phẩm Crawled</th>
                <th className="px-5 py-3.5 font-bold">Giá Trị</th>
                <th className="px-5 py-3.5 font-bold">Thời Gian</th>
                <th className="px-5 py-3.5 font-bold">Trạng Thái</th>
                <th className="px-5 py-3.5 text-right font-bold">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#2E3A47] text-xs text-[#1C2434] dark:text-slate-200">
              {MOCK_RECENT_ORDERS.map((order) => (
                <tr key={order.id} className="hover:bg-[#F1F5F9] dark:hover:bg-[#24303F] transition-colors">
                  <td className="px-5 py-4 font-mono font-bold text-[#3C50E0] dark:text-[#80CAEE]">{order.id}</td>
                  <td className="px-5 py-4">
                    <span className="font-bold text-[#1C2434] dark:text-white block">{order.customerName}</span>
                    <span className="text-[11px] text-[#64748B] dark:text-[#8A99AD] font-mono">{order.customerEmail}</span>
                  </td>
                  <td className="px-5 py-4 font-medium">{order.productName}</td>
                  <td className="px-5 py-4 font-mono font-bold">
                    {new Intl.NumberFormat("vi-VN").format(order.amount)}đ
                  </td>
                  <td className="px-5 py-4 text-[#64748B] dark:text-[#8A99AD] font-mono">{order.date}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase border ${
                        order.status === "PAID"
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200"
                          : order.status === "DELIVERED"
                          ? "bg-sky-50 text-[#3C50E0] dark:bg-sky-950/40 dark:text-[#80CAEE] border-sky-200"
                          : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200"
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      href="/admin/products"
                      className="text-[#3C50E0] dark:text-[#80CAEE] hover:underline font-bold"
                    >
                      Chi tiết
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
