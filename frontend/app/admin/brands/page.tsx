"use client";

import React, { useState } from "react";
import AdminJSPageHeader from "@/components/adminjs/AdminJSPageHeader";
import AdminJSResourceTable, { Column, AdminJSPillTag } from "@/components/adminjs/AdminJSResourceTable";

type Brand = {
  id: string;
  name: string;
  country: string;
  productCount: number;
  status: string;
};

const MOCK_BRANDS: Brand[] = [
  { id: "BR-01", name: "Kyoritsu", country: "Nhật Bản", productCount: 120, status: "active" },
  { id: "BR-02", name: "Hioki", country: "Nhật Bản", productCount: 95, status: "active" },
  { id: "BR-03", name: "Fluke", country: "Mỹ", productCount: 150, status: "active" },
  { id: "BR-04", name: "Uni-T", country: "Trung Quốc", productCount: 210, status: "active" },
  { id: "BR-05", name: "Sanwa", country: "Nhật Bản", productCount: 80, status: "active" },
  { id: "BR-06", name: "Testo", country: "Đức", productCount: 65, status: "active" },
];

export default function AdminBrandsPage() {
  const [brands] = useState<Brand[]>(MOCK_BRANDS);

  const columns: Column<Brand>[] = [
    {
      header: "Mã Hãng",
      accessor: "id",
      render: (b) => <span className="font-mono font-bold text-slate-800">{b.id}</span>,
    },
    {
      header: "Tên Thương Hiệu",
      accessor: "name",
      render: (b) => <span className="font-bold text-slate-900">{b.name}</span>,
    },
    {
      header: "Xuất Xứ",
      accessor: "country",
    },
    {
      header: "Số Sản Phẩm",
      accessor: "productCount",
      render: (b) => <span className="font-mono font-bold">{b.productCount} sản phẩm</span>,
    },
    {
      header: "Trạng Thái",
      render: (b) => (
        <AdminJSPillTag variant={b.status === "active" ? "purple" : "neutral"}>
          {b.status === "active" ? "ĐANG HỢP TÁC" : "TẠM DỪNG"}
        </AdminJSPillTag>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <AdminJSPageHeader
        title="Quản Lý Thương Hiệu (Brands Resource)"
        resourceName="Brands"
        count={brands.length}
        description="Danh sách nhà sản xuất và thương hiệu thiết bị đo lường đối tác."
        onAddNew={() => alert("Thêm thương hiệu mới")}
        addNewLabel="Tạo Thương Hiệu Mới"
      />

      <AdminJSResourceTable<Brand>
        columns={columns}
        data={brands}
        keyExtractor={(b) => b.id}
        onEdit={(b) => alert(`Chỉnh sửa thương hiệu: ${b.name}`)}
        onDelete={(b) => alert(`Xóa thương hiệu: ${b.name}`)}
      />
    </div>
  );
}
