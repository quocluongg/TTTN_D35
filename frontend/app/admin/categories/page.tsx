"use client";

import React, { useState } from "react";
import { Plus, Search, Edit, Trash2, FolderTree } from "lucide-react";
import { Button } from "@/components/ui/button";

const MOCK_CATEGORIES = [
  { id: "CAT-01", name: "Đồng hồ vạn năng", slug: "dong-ho-van-nang", itemCount: 142, status: "active" },
  { id: "CAT-02", name: "Ampe kìm", slug: "ampe-kim", itemCount: 88, status: "active" },
  { id: "CAT-03", name: "Máy đo điện trở cách điện", slug: "may-do-cach-dien", itemCount: 35, status: "active" },
  { id: "CAT-04", name: "Thiết bị đo nhiệt độ", slug: "thieth-bi-do-nhiet-do", itemCount: 54, status: "active" },
  { id: "CAT-05", name: "Máy đo sóng Oscillosope", slug: "may-do-song", itemCount: 19, status: "active" },
];

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState(MOCK_CATEGORIES);
  const [search, setSearch] = useState("");

  const filtered = categories.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-lg border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản Lý Danh Mục</h1>
          <p className="text-sm text-slate-500 mt-1">Phân loại và danh mục sản phẩm trên hệ thống</p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium flex items-center gap-2">
          <Plus className="w-4 h-4" />
          <span>Thêm Danh Mục Mới</span>
        </Button>
      </div>

      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex justify-between items-center">
        <div className="relative w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm danh mục..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <span className="text-xs font-mono text-slate-500">Tổng số: {filtered.length} danh mục</span>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-mono uppercase text-slate-500">
              <th className="p-4">Mã DM</th>
              <th className="p-4">Tên Danh Mục</th>
              <th className="p-4">Slug Đường Dẫn</th>
              <th className="p-4">Số Sản Phẩm</th>
              <th className="p-4">Trạng Thái</th>
              <th className="p-4 text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-sm">
            {filtered.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-4 font-mono text-xs font-semibold text-slate-600">{c.id}</td>
                <td className="p-4 font-bold text-slate-900">{c.name}</td>
                <td className="p-4 font-mono text-xs text-slate-500">/{c.slug}</td>
                <td className="p-4 font-mono font-semibold">{c.itemCount} SP</td>
                <td className="p-4">
                  <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-1 rounded-full">
                    Hiển thị
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
