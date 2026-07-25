"use client";

import React, { useState } from "react";
import { Plus, Search, ShieldCheck, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

const MOCK_WARRANTIES = [
  { id: "WAR-2024-001", customerPhone: "0901234567", customerName: "Nguyễn Văn A", productName: "Đồng hồ vạn năng Kyoritsu 1009", serial: "KY-1009-88392", purchaseDate: "2024-01-15", expiryDate: "2025-01-15", status: "active" },
  { id: "WAR-2023-089", customerPhone: "0987654321", customerName: "Trần Văn B", productName: "Ampe kìm Hioki 3280-10F", serial: "HK-3280-99210", purchaseDate: "2023-05-10", expiryDate: "2024-05-10", status: "expired" },
];

export default function AdminWarrantiesPage() {
  const [warranties, setWarranties] = useState(MOCK_WARRANTIES);
  const [search, setSearch] = useState("");

  const filtered = warranties.filter(
    (w) =>
      w.customerPhone.includes(search) ||
      w.serial.toLowerCase().includes(search.toLowerCase()) ||
      w.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-lg border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản Lý Thẻ Bảo Hành & Lịch Sử Sửa Chữa</h1>
          <p className="text-sm text-slate-500 mt-1">Cấp phát thẻ bảo hành điện tử và theo dõi tiếp nhận thiết bị</p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium flex items-center gap-2">
          <Plus className="w-4 h-4" />
          <span>Tạo Thẻ Bảo Hành Mới</span>
        </Button>
      </div>

      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex justify-between items-center">
        <div className="relative w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo SĐT, Serial, Mã thẻ..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <span className="text-xs font-mono text-slate-500">Tổng số: {filtered.length} thẻ</span>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-mono uppercase text-slate-500">
              <th className="p-4">Mã Thẻ</th>
              <th className="p-4">Khách Hàng & SĐT</th>
              <th className="p-4">Tên Thiết Bị</th>
              <th className="p-4">Số Serial</th>
              <th className="p-4">Ngày Mua</th>
              <th className="p-4">Hạn Bảo Hành</th>
              <th className="p-4">Trạng Thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-sm">
            {filtered.map((w) => (
              <tr key={w.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-4 font-mono text-xs font-bold text-emerald-700">{w.id}</td>
                <td className="p-4">
                  <p className="font-bold text-slate-900">{w.customerName}</p>
                  <span className="text-xs font-mono text-slate-500">{w.customerPhone}</span>
                </td>
                <td className="p-4 font-medium text-slate-800">{w.productName}</td>
                <td className="p-4 font-mono text-xs text-slate-600">{w.serial}</td>
                <td className="p-4 font-mono text-xs text-slate-600">{w.purchaseDate}</td>
                <td className="p-4 font-mono text-xs font-bold text-slate-900">{w.expiryDate}</td>
                <td className="p-4">
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                      w.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                    }`}
                  >
                    {w.status === "active" ? "Còn bảo hành" : "Hết hạn"}
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
