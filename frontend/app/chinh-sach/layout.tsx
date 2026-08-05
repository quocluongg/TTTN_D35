"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight, FileText } from "lucide-react";
import PublicLayout from "@/shared/layouts/PublicLayout";

export default function PolicyLayout({ children }: { children: React.ReactNode }) {
  const policies = [
    { name: "Hướng Dẫn Mua Hàng", href: "/chinh-sach/huong-dan-mua-hang" },
    { name: "Chính Sách Vận Chuyển", href: "/chinh-sach/chinh-sach-van-chuyen" },
    { name: "Chính Sách Bảo Hành & Đổi Trả", href: "/chinh-sach/chinh-sach-bao-hanh" },
    { name: "Chính Sách Bảo Mật Thông Tin", href: "/chinh-sach/chinh-sach-bao-mat" },
    { name: "Quy Định Chung", href: "/chinh-sach/quy-dinh-chung" },
    { name: "Giải Quyết Khiếu Nại", href: "/chinh-sach/giai-quyet-khieu-nai" },
  ];

  return (
    <PublicLayout fullWidth>
    <div className="min-h-screen bg-[#F2F2F2] dark:bg-zinc-900 text-black dark:text-white">
      {/* ===== HERO HEADER ===== */}
      <section className="border-b border-black dark:border-zinc-800 bg-[#C5C5C5] dark:bg-zinc-800 p-8 lg:p-16">
        <div className="max-w-[1920px] mx-auto">
          <div className="inline-flex items-center gap-2 bg-black text-white dark:bg-white dark:text-black px-3 py-1 text-xs font-mono tracking-widest uppercase mb-6 rounded-none">
            <FileText className="w-3.5 h-3.5" />
            <span>Trung Tâm Điều Khoản</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-medium tracking-tight uppercase leading-none mb-4">
            Chính Sách & Quy Định
          </h1>
          <p className="text-base md:text-lg text-neutral-800 dark:text-zinc-300 max-w-2xl leading-relaxed">
            Cam kết minh bạch về thông tin sản phẩm, quyền lợi khách hàng, vận chuyển và bảo hành tại Shopwise.
          </p>
        </div>
      </section>

      {/* ===== SIDEBAR & CONTENT SPLIT ===== */}
      <section className="p-8 lg:p-16 border-b border-black dark:border-zinc-800">
        <div className="max-w-[1920px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 border-t border-l border-black dark:border-zinc-800">
            {/* SIDEBAR */}
            <div className="p-6 border-r border-b border-black dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-2">
              <h3 className="text-xs font-mono uppercase text-neutral-400 mb-4 px-2 tracking-widest">
                Danh Mục Điều Khoản
              </h3>
              {policies.map((p) => (
                <Link
                  key={p.href}
                  href={p.href}
                  className="flex items-center justify-between p-3 border border-black/10 dark:border-zinc-800 hover:border-black dark:hover:border-zinc-500 bg-[#F2F2F2] dark:bg-zinc-900 text-sm font-medium transition-all group"
                >
                  <span>{p.name}</span>
                  <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-black dark:group-hover:text-white" />
                </Link>
              ))}
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="lg:col-span-3 p-8 lg:p-12 border-r border-b border-black dark:border-zinc-800 bg-white dark:bg-zinc-950">
              <div className="prose dark:prose-invert max-w-none prose-headings:font-medium prose-headings:tracking-tight prose-h2:text-2xl prose-h2:border-b prose-h2:border-black/20 prose-h2:pb-2 prose-h3:text-xl">
                {children}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
    </PublicLayout>
  );
}
