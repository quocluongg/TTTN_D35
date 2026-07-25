"use client";

import React from "react";
import Link from "next/link";
import { CheckCircle2, ShoppingBag, ArrowRight, Printer, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PaymentPage() {
  return (
    <div className="min-h-screen bg-[#F2F2F2] dark:bg-zinc-900 text-black dark:text-white pt-[60px]">
      {/* ===== HERO HEADER ===== */}
      <section className="border-b border-black dark:border-zinc-800 bg-[#C5C5C5] dark:bg-zinc-800 p-8 lg:p-16 text-center">
        <div className="max-w-[1920px] mx-auto">
          <div className="w-16 h-16 bg-black text-white dark:bg-white dark:text-black flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <h1 className="text-4xl md:text-5xl font-medium tracking-tight uppercase mb-3">
            Thanh Toán Thành Công!
          </h1>

          <p className="text-base text-neutral-800 dark:text-zinc-300 max-w-xl mx-auto">
            Cảm ơn quý khách đã tin tưởng mua sắm tại Shopwise. Đơn hàng của bạn đã được ghi nhận và đang chuẩn bị xuất kho.
          </p>
        </div>
      </section>

      {/* ===== INVOICE SUMMARY GRID ===== */}
      <section className="p-8 lg:p-16 border-b border-black dark:border-zinc-800">
        <div className="max-w-4xl mx-auto border border-black dark:border-zinc-800 bg-white dark:bg-zinc-950 p-8 lg:p-12 space-y-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-black/10 dark:border-zinc-800 gap-4">
            <div>
              <span className="text-xs font-mono uppercase text-neutral-400">Mã đơn hàng</span>
              <h2 className="text-2xl font-bold tracking-tight font-mono">SW-892104</h2>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-xs font-mono uppercase text-neutral-400">Trạng thái thanh toán</span>
              <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 uppercase font-mono">
                ✓ Đã Thanh Toán Qua VNPAY
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm font-mono border-b border-black/10 dark:border-zinc-800 pb-6">
            <div>
              <span className="block text-neutral-400 text-xs">NGÀY ĐẶT:</span>
              <span className="font-bold">{new Date().toLocaleDateString("vi-VN")}</span>
            </div>
            <div>
              <span className="block text-neutral-400 text-xs">PHƯƠNG THỨC:</span>
              <span className="font-bold">Chuyển Khoản VNPAY-QR</span>
            </div>
            <div>
              <span className="block text-neutral-400 text-xs">DỰ KIẾN GIAO HÀNG:</span>
              <span className="font-bold">1 - 2 Ngày Làm Việc</span>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium tracking-tight uppercase">Chi Tiết Đơn Hàng</h3>
            <div className="border border-black/10 dark:border-zinc-800 divide-y divide-black/10 dark:divide-zinc-800">
              <div className="p-4 flex justify-between items-center text-sm">
                <div>
                  <p className="font-medium">Đồng hồ vạn năng Kyoritsu 1009</p>
                  <span className="text-xs font-mono text-neutral-500">Số lượng: 1 x 1.450.000đ</span>
                </div>
                <span className="font-mono font-bold">1.450.000đ</span>
              </div>
              <div className="p-4 flex justify-between items-center text-sm bg-[#F2F2F2] dark:bg-zinc-900 font-bold font-mono">
                <span>TỔNG THANH TOÁN</span>
                <span className="text-lg">1.450.000đ</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link
              href="/shop"
              className="flex-1 h-14 bg-black text-white hover:bg-neutral-900 dark:bg-white dark:text-black rounded-none text-sm font-medium uppercase tracking-tight flex items-center justify-center gap-2 border border-black dark:border-zinc-700"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Tiếp Tục Mua Sắm</span>
            </Link>
            <Button
              onClick={() => window.print()}
              variant="outline"
              className="h-14 px-8 border-black dark:border-zinc-700 rounded-none text-sm font-medium uppercase tracking-tight flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>In Hóa Đơn</span>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
