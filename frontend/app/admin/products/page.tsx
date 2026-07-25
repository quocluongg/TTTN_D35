"use client";

import React, { useState } from "react";
import { Plus, Search, Filter, Edit, Trash2, Eye, CheckCircle2, XCircle, Package } from "lucide-react";
import { Button } from "@/components/ui/button";

const MOCK_PRODUCTS = [
  { id: "PROD-001", name: "Đồng hồ vạn năng Kyoritsu 1009", category: "Đồng hồ vạn năng", brand: "Kyoritsu", price: 1450000, stock: 45, status: "active" },
  { id: "PROD-002", name: "Ampe kìm Hioki 3280-10F", category: "Ampe kìm", brand: "Hioki", price: 1250000, stock: 28, status: "active" },
  { id: "PROD-003", name: "Máy đo điện trở cách điện Fluke 1507", category: "Máy đo cách điện", brand: "Fluke", price: 11200000, stock: 8, status: "active" },
  { id: "PROD-004", name: "Đồng hồ vạn năng số Sanwa CD800a", category: "Đồng hồ vạn năng", brand: "Sanwa", price: 780000, stock: 0, status: "out_of_stock" },
  { id: "PROD-005", name: "Máy đo nhiệt độ hồng ngoại Testo 830-T2", category: "Thiết bị đo nhiệt độ", brand: "Testo", price: 2350000, stock: 15, status: "active" },
];

export default function AdminProductsPage() {
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState(MOCK_PRODUCTS);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) || p.brand.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-lg border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản Lý Sản Phẩm</h1>
          <p className="text-sm text-slate-500 mt-1">Danh sách tất cả thiết bị đo và tồn kho trong hệ thống</p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium flex items-center gap-2">
          <Plus className="w-4 h-4" />
          <span>Thêm Sản Phẩm Mới</span>
        </Button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm sản phẩm, thương hiệu..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
          <Package className="w-4 h-4" />
          <span>Tổng số: {filtered.length} sản phẩm</span>
        </div>
      </div>

      {/* Products Data Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-mono uppercase text-slate-500">
              <th className="p-4">Mã SP</th>
              <th className="p-4">Tên Sản Phẩm</th>
              <th className="p-4">Danh Mục</th>
              <th className="p-4">Hãng</th>
              <th className="p-4">Giá Bán</th>
              <th className="p-4">Tồn Kho</th>
              <th className="p-4">Trạng Thái</th>
              <th className="p-4 text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-sm">
            {filtered.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-4 font-mono text-xs font-semibold text-slate-600">{p.id}</td>
                <td className="p-4 font-medium text-slate-900">{p.name}</td>
                <td className="p-4 text-slate-600">{p.category}</td>
                <td className="p-4 font-semibold text-slate-700">{p.brand}</td>
                <td className="p-4 font-mono font-bold text-slate-900">
                  {new Intl.NumberFormat("vi-VN").format(p.price)}đ
                </td>
                <td className="p-4 font-mono">{p.stock}</td>
                <td className="p-4">
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                      p.status === "active"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {p.status === "active" ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    {p.status === "active" ? "Đang bán" : "Hết hàng"}
                  </span>
                </td>
                <td className="p-4 text-right space-x-2">
                  <button className="p-1 text-slate-500 hover:text-slate-900 rounded">
                    <Eye className="w-4 h-4" />
                  </button>
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
