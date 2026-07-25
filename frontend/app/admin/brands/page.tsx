"use client";

import React, { useState } from "react";
import { Plus, Search, Edit, Trash2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

const MOCK_BRANDS = [
  { id: "BR-01", name: "Kyoritsu", country: "Nhật Bản", productCount: 120, status: "active" },
  { id: "BR-02", name: "Hioki", country: "Nhật Bản", productCount: 95, status: "active" },
  { id: "BR-03", name: "Fluke", country: "Mỹ", productCount: 150, status: "active" },
  { id: "BR-04", name: "Uni-T", country: "Trung Quốc", productCount: 210, status: "active" },
  { id: "BR-05", name: "Sanwa", country: "Nhật Bản", productCount: 80, status: "active" },
  { id: "BR-06", name: "Testo", country: "Đức", productCount: 65, status: "active" },
];

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState(MOCK_BRANDS);
  const [search, setSearch] = useState("");

  const filtered = brands.filter((b) => b.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-lg border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản Lý Thương Hiệu</h1>
          <p className="text-sm text-slate-500 mt-1">Danh sách nhà sản xuất và đối tác thiết bị đo lường</p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium flex items-center gap-2">
          <Plus className="w-4 h-4" />
          <span>Thêm Thương Hiệu</span>
        </Button>
      </div>

      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex justify-between items-center">
        <div className="relative w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm hãng sản xuất..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <span className="text-xs font-mono text-slate-500">Tổng số: {filtered.length} hãng</span>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-mono uppercase text-slate-500">
              <th className="p-4">Mã Hãng</th>
              <th className="p-4">Tên Thương Hiệu</th>
              <th className="p-4">Xuất Xứ</th>
              <th className="p-4">Số Sản Phẩm</th>
              <th className="p-4">Trạng Thái</th>
              <th className="p-4 text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-sm">
            {filtered.map((b) => (
              <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-4 font-mono text-xs font-semibold text-slate-600">{b.id}</td>
                <td className="p-4 font-bold text-slate-900">{b.name}</td>
                <td className="p-4 text-slate-600">{b.country}</td>
                <td className="p-4 font-mono font-semibold">{b.productCount} SP</td>
                <td className="p-4">
                  <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-1 rounded-full">
                    Đang hợp tác
                  </span>
                </td>
                <td className="p-4 text-right space-x-2">
                  <button className="p-1 text-blue-600 hover:text-blue-800 rounded">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button className="p-1 text-red-600 hover:text-red-800 rounded">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
