"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Search,
  ShieldCheck,
  Phone,
  Calendar,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  History,
  Hash,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type WarrantyCard = {
  id: string;
  customer_phone: string;
  customer_name: string | null;
  product_name: string;
  serial_number: string | null;
  purchase_date: string;
  warranty_months: number;
  expiry_date: string;
  note: string | null;
  status: "active" | "expired" | "voided";
};

// Mock demo data for lookup testing
const MOCK_WARRANTY_DATA: WarrantyCard[] = [
  {
    id: "WAR-2024-001",
    customer_phone: "0901234567",
    customer_name: "Nguyễn Văn A",
    product_name: "Đồng hồ vạn năng Kyoritsu 1009",
    serial_number: "KY-1009-88392",
    purchase_date: "2024-01-15",
    warranty_months: 12,
    expiry_date: "2025-01-15",
    note: "Sản phẩm mua chính hãng kèm tem niêm phong",
    status: "active",
  },
  {
    id: "WAR-2023-089",
    customer_phone: "0901234567",
    customer_name: "Nguyễn Văn A",
    product_name: "Ampe kìm Hioki 3280-10F",
    serial_number: "HK-3280-99210",
    purchase_date: "2023-05-10",
    warranty_months: 12,
    expiry_date: "2024-05-10",
    note: "Đã hết hạn bảo hành",
    status: "expired",
  },
];

export default function WarrantyCheckPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [results, setResults] = useState<WarrantyCard[]>([]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(false);

    setTimeout(() => {
      const clean = query.trim().replace(/\s/g, "");
      const found = MOCK_WARRANTY_DATA.filter(
        (card) =>
          card.customer_phone.includes(clean) ||
          (card.serial_number && card.serial_number.toLowerCase().includes(clean.toLowerCase())) ||
          card.id.toLowerCase().includes(clean.toLowerCase())
      );
      setResults(found);
      setLoading(false);
      setSearched(true);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#F2F2F2] dark:bg-zinc-900 text-black dark:text-white pt-[60px]">
      {/* ===== HERO SEARCH HEADER ===== */}
      <section className="border-b border-black dark:border-zinc-800 bg-[#C5C5C5] dark:bg-zinc-800 p-8 lg:p-16">
        <div className="max-w-[1920px] mx-auto">
          <div className="inline-flex items-center gap-2 bg-black text-white dark:bg-white dark:text-black px-3 py-1 text-xs font-mono tracking-widest uppercase mb-6 rounded-none">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Hệ Thống Tra Cứu Điện Tử</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-medium tracking-tight uppercase leading-none mb-4">
            Tra Cứu Bảo Hành & Sửa Chữa
          </h1>

          <p className="text-base md:text-lg text-neutral-800 dark:text-zinc-300 max-w-2xl leading-relaxed mb-8">
            Nhập số điện thoại mua hàng, số Serial thiết bị hoặc Mã bảo hành để kiểm tra thời hạn và lịch sử dịch vụ.
          </p>

          <form onSubmit={handleSearch} className="max-w-2xl flex flex-col sm:flex-row gap-0">
            <div className="relative flex-1">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Nhập SĐT / Serial / Mã bảo hành (Ví dụ: 0901234567)..."
                className="w-full h-14 bg-white dark:bg-zinc-900 border border-black dark:border-zinc-700 px-5 text-base outline-none rounded-none placeholder:text-neutral-400 focus:ring-1 focus:ring-black"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="h-14 px-8 bg-black text-white hover:bg-neutral-900 dark:bg-white dark:text-black dark:hover:bg-zinc-200 rounded-none text-base font-medium uppercase tracking-tight flex items-center justify-center shrink-0 border border-black dark:border-zinc-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Đang Tra Cứu...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5 mr-2" />
                  Tra Cứu Ngay
                </>
              )}
            </Button>
          </form>
        </div>
      </section>

      {/* ===== RESULTS SECTION ===== */}
      <section className="p-8 lg:p-16 border-b border-black dark:border-zinc-800">
        <div className="max-w-[1920px] mx-auto">
          {!searched && !loading && (
            <div className="p-12 border border-black dark:border-zinc-800 bg-white dark:bg-zinc-950 text-center">
              <ShieldCheck className="w-12 h-12 mx-auto text-neutral-400 mb-4" />
              <h3 className="text-xl font-medium tracking-tight uppercase mb-2">Vui Lòng Nhập Thông Tin Tra Cứu</h3>
              <p className="text-sm text-neutral-600 dark:text-zinc-400">
                Nhập số điện thoại đã sử dụng khi mua hàng tại Shopwise để hiển thị danh sách thẻ bảo hành.
              </p>
            </div>
          )}

          {searched && results.length === 0 && (
            <div className="p-12 border border-black dark:border-zinc-800 bg-white dark:bg-zinc-950 text-center">
              <XCircle className="w-12 h-12 mx-auto text-neutral-400 mb-4" />
              <h3 className="text-xl font-medium tracking-tight uppercase mb-2">Không Tìm Thấy Thông Tin</h3>
              <p className="text-sm text-neutral-600 dark:text-zinc-400 mb-6">
                Không tìm thấy dữ liệu bảo hành tương ứng với thông tin &quot;{query}&quot;.
              </p>
              <Button
                variant="outline"
                onClick={() => setQuery("0901234567")}
                className="rounded-none border-black dark:border-zinc-700 text-xs font-mono uppercase"
              >
                Thử Với Số Demo: 0901234567
              </Button>
            </div>
          )}

          {searched && results.length > 0 && (
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-black dark:border-zinc-800">
                <h2 className="text-2xl font-medium tracking-tight uppercase">
                  Kết Quả Tra Cứu ({results.length} sản phẩm)
                </h2>
                <span className="text-xs font-mono text-neutral-500 uppercase">Dữ liệu cập nhật realtime</span>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {results.map((card) => (
                  <div
                    key={card.id}
                    className="border border-black dark:border-zinc-800 bg-white dark:bg-zinc-950 p-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6"
                  >
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono uppercase bg-neutral-100 dark:bg-zinc-800 px-2 py-1 border border-black/20">
                          {card.id}
                        </span>
                        <span
                          className={`text-xs font-mono uppercase px-2.5 py-1 border ${
                            card.status === "active"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300"
                              : "bg-red-50 text-red-700 border-red-300 dark:bg-red-950 dark:text-red-300"
                          }`}
                        >
                          {card.status === "active" ? "✓ Còn bảo hành" : "✕ Hết hạn"}
                        </span>
                      </div>

                      <h3 className="text-2xl font-medium tracking-tight">{card.product_name}</h3>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono text-neutral-600 dark:text-zinc-400 pt-2">
                        <div>
                          <span className="block text-neutral-400">Khách hàng:</span>
                          <span className="font-bold text-black dark:text-white">{card.customer_name}</span>
                        </div>
                        <div>
                          <span className="block text-neutral-400">SĐT:</span>
                          <span className="font-bold text-black dark:text-white">{card.customer_phone}</span>
                        </div>
                        <div>
                          <span className="block text-neutral-400">Serial No:</span>
                          <span className="font-bold text-black dark:text-white">{card.serial_number}</span>
                        </div>
                        <div>
                          <span className="block text-neutral-400">Hạn bảo hành:</span>
                          <span className="font-bold text-black dark:text-white">{card.expiry_date}</span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t lg:border-t-0 lg:border-l border-black/10 dark:border-zinc-800 pt-4 lg:pt-0 lg:pl-6 shrink-0 w-full lg:w-auto">
                      <p className="text-xs font-mono text-neutral-500 mb-2">Ghi chú bảo hành:</p>
                      <p className="text-sm italic text-neutral-700 dark:text-zinc-300 max-w-xs">{card.note}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ===== SUPPORT BANNER ===== */}
      <section className="p-8 lg:p-16 bg-[#F2F2F2] dark:bg-zinc-900">
        <div className="max-w-[1920px] mx-auto border border-black dark:border-zinc-800 p-8 lg:p-12 bg-white dark:bg-zinc-950 flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h3 className="text-2xl font-medium tracking-tight uppercase mb-2">Cần Hỗ Trợ Kỹ Thuật Trực Tiếp?</h3>
            <p className="text-sm text-neutral-600 dark:text-zinc-400">
              Liên hệ Hotline 1900-XXXX hoặc mang thiết bị tới các trung tâm bảo hành ủy quyền của Shopwise.
            </p>
          </div>
          <Link
            href="/contact"
            className="px-8 py-4 bg-black text-white hover:bg-neutral-900 dark:bg-white dark:text-black rounded-none text-sm font-medium uppercase tracking-tight shrink-0 flex items-center gap-2"
          >
            <span>Liên Hệ Trung Tâm Bảo Hành</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
