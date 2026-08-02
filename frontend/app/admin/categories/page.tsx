"use client";

import React, { useState, useEffect } from "react";
import AdminJSPageHeader from "@/components/adminjs/AdminJSPageHeader";
import AdminJSResourceTable, { Column, AdminJSPillTag } from "@/components/adminjs/AdminJSResourceTable";
import { FolderTree, Tag, CheckCircle2 } from "lucide-react";

type RealCategory = {
  id: string;
  name: string;
  slug: string;
  itemCount: number;
  status: "active";
};

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<RealCategory[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      // Fetch 100 items from Silver data layer to aggregate category stats
      const res = await fetch("/api/admin/crawled-products?pageSize=100&layer=SILVER");
      const data = await res.json();

      if (data.success && Array.isArray(data.data)) {
        const catMap: Record<string, number> = {};
        data.data.forEach((p: any) => {
          const cat = p.category || "Điện thoại";
          catMap[cat] = (catMap[cat] || 0) + 1;
        });

        const list: RealCategory[] = Object.entries(catMap).map(([catName, count], idx) => ({
          id: `CAT-${(idx + 1).toString().padStart(2, "0")}`,
          name: catName,
          slug: catName
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "-"),
          itemCount: count,
          status: "active",
        }));

        setCategories(list);
      }
    } catch (err) {
      console.error("Lỗi khi tải danh mục crawl:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const columns: Column<RealCategory>[] = [
    {
      header: "Mã Danh Mục",
      accessor: "id",
      render: (c) => <span className="font-mono font-bold text-[#3C50E0] dark:text-[#80CAEE] text-xs">{c.id}</span>,
    },
    {
      header: "Tên Danh Mục Crawled",
      accessor: "name",
      render: (c) => (
        <div className="flex items-center gap-2">
          <FolderTree className="w-4 h-4 text-[#3C50E0] dark:text-[#80CAEE]" />
          <span className="font-bold text-[#1C2434] dark:text-white">{c.name}</span>
        </div>
      ),
    },
    {
      header: "Slug URL",
      accessor: "slug",
      render: (c) => <span className="font-mono text-slate-500 dark:text-slate-400">/{c.slug}</span>,
    },
    {
      header: "Số Sản Phẩm (Crawled)",
      accessor: "itemCount",
      render: (c) => (
        <span className="font-mono font-bold text-[#1C2434] dark:text-white">
          {c.itemCount} sản phẩm
        </span>
      ),
    },
    {
      header: "Trạng Thái",
      render: () => (
        <AdminJSPillTag variant="success">
          <div className="inline-flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>ACTIVE (CRAWLED)</span>
          </div>
        </AdminJSPillTag>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <AdminJSPageHeader
        title="Danh Mục Sản Phẩm (Crawled Categories)"
        resourceName="Categories"
        count={categories.length}
        description="Các nhóm danh mục điện tử được trích xuất trực tiếp từ kho dữ liệu crawl."
        onRefresh={() => fetchCategories()}
      />

      <AdminJSResourceTable<RealCategory>
        columns={columns}
        data={categories}
        isLoading={isLoading}
        keyExtractor={(c) => c.id}
      />
    </div>
  );
}
