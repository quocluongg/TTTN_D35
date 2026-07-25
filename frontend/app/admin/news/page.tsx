"use client";

import React, { useState } from "react";
import { Plus, Search, Newspaper, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const MOCK_NEWS = [
  { id: "NEWS-01", title: "Huawei Pura 90s Pro và Pro Max ra mắt với camera tele 200MP", author: "BTV Kỹ Thuật", date: "18/07/2026", status: "published" },
  { id: "NEWS-02", title: "Hướng dẫn chọn mua đồng hồ vạn năng số cho kỹ sư điện tử", author: "Chuyên Gia Kỹ Thuật", date: "15/07/2026", status: "published" },
  { id: "NEWS-03", title: "ASUS ra mắt dải sản phẩm laptop đồ họa ProArt thế hệ mới", author: "Tin Công Nghệ", date: "10/07/2026", status: "published" },
];

export default function AdminNewsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-lg border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản Lý Tin Tức & Bài Viết Kỹ Thuật</h1>
          <p className="text-sm text-slate-500 mt-1">Đăng tải bài viết đánh giá thiết bị, tin công nghệ và hướng dẫn</p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium flex items-center gap-2">
          <Plus className="w-4 h-4" />
          <span>Viết Bài Mới</span>
        </Button>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-mono uppercase text-slate-500">
              <th className="p-4">Mã Bài</th>
              <th className="p-4">Tiêu Đề Bài Viết</th>
              <th className="p-4">Tác Giả</th>
              <th className="p-4">Ngày Đăng</th>
              <th className="p-4">Trạng Thái</th>
              <th className="p-4 text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-sm">
            {MOCK_NEWS.map((n) => (
              <tr key={n.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-4 font-mono text-xs font-semibold text-slate-600">{n.id}</td>
                <td className="p-4 font-medium text-slate-900 max-w-md truncate">{n.title}</td>
                <td className="p-4 text-slate-600">{n.author}</td>
                <td className="p-4 font-mono text-xs text-slate-500">{n.date}</td>
                <td className="p-4">
                  <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-1 rounded-full">
                    Đã xuất bản
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
