"use client";

import React, { useState } from "react";
import { Plus, Search, Tag, Calendar, Percent } from "lucide-react";
import { Button } from "@/components/ui/button";

const MOCK_PROMOTIONS = [
  { id: "PROMO-01", code: "SHOPWISE10", discount: "Giảm 10%", maxUsage: 500, used: 142, status: "active" },
  { id: "PROMO-02", code: "FREESHIP", discount: "Miễn phí vận chuyển", maxUsage: 1000, used: 890, status: "active" },
  { id: "PROMO-03", code: "FLASHSALE50", discount: "Giảm 50K đơn từ 1M", maxUsage: 200, used: 200, status: "expired" },
];

export default function AdminPromotionsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-lg border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản Lý Mã Giảm Giá & Khuyến Mãi</h1>
          <p className="text-sm text-slate-500 mt-1">Cấu hình voucher, campaign flash sale và ưu đãi mua sắm</p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium flex items-center gap-2">
          <Plus className="w-4 h-4" />
          <span>Tạo Mã Khuyến Mãi Mới</span>
        </Button>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-mono uppercase text-slate-500">
              <th className="p-4">Mã KM</th>
              <th className="p-4">Voucher Code</th>
              <th className="p-4">Mức Ưu Đãi</th>
              <th className="p-4">Lượt Sử Dụng</th>
              <th className="p-4">Trạng Thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-sm">
            {MOCK_PROMOTIONS.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-4 font-mono text-xs font-semibold text-slate-600">{p.id}</td>
                <td className="p-4 font-mono font-bold text-slate-900">{p.code}</td>
                <td className="p-4 font-semibold text-emerald-700">{p.discount}</td>
                <td className="p-4 font-mono">{p.used} / {p.maxUsage}</td>
                <td className="p-4">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${p.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>
                    {p.status === "active" ? "Đang áp dụng" : "Đã kết thúc"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
