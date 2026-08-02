"use client";

import React, { useState, useEffect } from "react";
import AdminJSPageHeader from "@/components/adminjs/AdminJSPageHeader";
import AdminJSResourceTable, { Column, AdminJSPillTag } from "@/components/adminjs/AdminJSResourceTable";
import AdminJSFilterDrawer from "@/components/adminjs/AdminJSFilterDrawer";
import { ExternalLink, Database, Filter, Eye, Layers } from "lucide-react";

type CrawledProduct = {
  id: string;
  name: string;
  category: string;
  price: number;
  specifications: Record<string, string>;
  description: string;
  url: string;
  images: string[];
  updated_at?: string;
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<CrawledProduct[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [page, setPage] = useState<number>(1);

  // Filters
  const [search, setSearch] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [selectedLayer, setSelectedLayer] = useState<"SILVER" | "BRONZE">("SILVER");
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
  const [detailProduct, setDetailProduct] = useState<CrawledProduct | null>(null);

  // Fetch Crawled Products
  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: "10",
        layer: selectedLayer,
      });
      if (search) params.append("search", search);
      if (categoryFilter) params.append("category", categoryFilter);

      const res = await fetch(`/api/admin/crawled-products?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setProducts(data.data || []);
        setCategories(data.categories || []);
        setTotalElements(data.totalElements || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error("Lỗi khi tải dữ liệu crawl:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, selectedLayer, categoryFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

  const columns: Column<CrawledProduct>[] = [
    {
      header: "Mã SP / ID",
      accessor: "id",
      render: (p) => <span className="font-mono font-bold text-[#3C50E0] dark:text-[#80CAEE] text-xs">{p.id}</span>,
    },
    {
      header: "Tên Sản Phẩm Crawl",
      accessor: "name",
      render: (p) => (
        <div className="flex items-center gap-3 max-w-md">
          {p.images && p.images[0] && !p.images[0].includes("no_selection") ? (
            <img
              src={p.images[0]}
              alt={p.name}
              className="w-10 h-10 object-contain rounded-lg border border-[#E2E8F0] dark:border-[#2E3A47] bg-white p-0.5 shrink-0"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-[#EFF4FB] dark:bg-[#24303F] text-[#3C50E0] flex items-center justify-center font-bold text-xs shrink-0">
              SP
            </div>
          )}
          <div className="min-w-0">
            <p className="font-bold text-[#1C2434] dark:text-white truncate" title={p.name}>
              {p.name}
            </p>
            <p className="text-[11px] text-[#64748B] dark:text-[#8A99AD] truncate">{p.url}</p>
          </div>
        </div>
      ),
    },
    {
      header: "Danh Mục",
      accessor: "category",
      render: (p) => (
        <span className="px-2.5 py-1 rounded-md bg-[#EFF4FB] dark:bg-[#24303F] text-[#1C2434] dark:text-slate-200 font-semibold text-[11px]">
          {p.category || "Điện tử"}
        </span>
      ),
    },
    {
      header: "Giá Niêm Yết (VNĐ)",
      accessor: "price",
      render: (p) => (
        <span className="font-mono font-bold text-[#1C2434] dark:text-white">
          {p.price > 0 ? `${new Intl.NumberFormat("vi-VN").format(p.price)}đ` : "Liên hệ / 0đ"}
        </span>
      ),
    },
    {
      header: "Tầng Data Pipeline",
      render: () => (
        <AdminJSPillTag variant={selectedLayer === "SILVER" ? "success" : "warning"}>
          {selectedLayer === "SILVER" ? "CLEANED (SILVER)" : "RAW (BRONZE)"}
        </AdminJSPillTag>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <AdminJSPageHeader
        title="Dữ Liệu Sản Phẩm Crawl (Electronics Repository)"
        resourceName="Crawled Data"
        count={totalElements}
        description="Toàn bộ danh mục sản phẩm thiết bị điện tử đã crawl từ CellphoneS và qua xử lý Medallion Pipeline."
        onFilterToggle={() => setIsFilterOpen(true)}
        onRefresh={() => fetchProducts()}
      />

      {/* Layer Switcher Tabs */}
      <div className="flex items-center justify-between bg-white dark:bg-[#1E293B] p-4 rounded-xl border border-[#E2E8F0] dark:border-[#2E3A47] shadow-xs">
        <div className="flex items-center gap-3">
          <Database className="w-5 h-5 text-[#3C50E0] dark:text-[#80CAEE]" />
          <span className="text-xs font-bold text-[#1C2434] dark:text-white">Chọn Tầng Dữ Liệu:</span>
          <div className="flex items-center bg-[#F1F5F9] dark:bg-[#10172A] p-1 rounded-lg border border-[#E2E8F0] dark:border-[#2E3A47]">
            <button
              onClick={() => {
                setSelectedLayer("SILVER");
                setPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition ${
                selectedLayer === "SILVER"
                  ? "bg-[#3C50E0] text-white shadow-xs"
                  : "text-[#64748B] dark:text-[#8A99AD] hover:text-[#1C2434] dark:hover:text-white"
              }`}
            >
              Silver (Cleaned Data)
            </button>
            <button
              onClick={() => {
                setSelectedLayer("BRONZE");
                setPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition ${
                selectedLayer === "BRONZE"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "text-[#64748B] dark:text-[#8A99AD] hover:text-[#1C2434] dark:hover:text-white"
              }`}
            >
              Bronze (Raw Crawl)
            </button>
          </div>
        </div>

        {/* Quick Search */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên sản phẩm..."
            className="p-2 bg-[#F1F5F9] dark:bg-[#10172A] border border-[#E2E8F0] dark:border-[#2E3A47] rounded-lg text-xs text-[#1C2434] dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#3C50E0]"
          />
          <button
            type="submit"
            className="px-3 py-2 bg-[#3C50E0] text-white rounded-lg text-xs font-bold hover:bg-[#3C50E0]/90 transition"
          >
            Tìm
          </button>
        </form>
      </div>

      {/* Main Crawled Products Resource Table */}
      <AdminJSResourceTable<CrawledProduct>
        columns={columns}
        data={products}
        isLoading={isLoading}
        keyExtractor={(p) => p.id}
        onView={(p) => setDetailProduct(p)}
        currentPage={page}
        totalPages={totalPages}
        totalElements={totalElements}
        onPageChange={(newPage) => setPage(newPage)}
      />

      {/* Filter Drawer */}
      <AdminJSFilterDrawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={() => {
          setIsFilterOpen(false);
          setPage(1);
          fetchProducts();
        }}
        onReset={() => {
          setSearch("");
          setCategoryFilter("");
          setPage(1);
        }}
      >
        <div className="space-y-4">
          <div>
            <label className="block font-bold text-[#1C2434] dark:text-white mb-1 text-xs">
              Từ khóa sản phẩm
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nhập tên sản phẩm..."
              className="w-full p-2.5 bg-[#F1F5F9] dark:bg-[#10172A] border border-[#E2E8F0] dark:border-[#2E3A47] rounded-md text-xs text-[#1C2434] dark:text-white focus:outline-none focus:border-[#3C50E0]"
            />
          </div>

          <div>
            <label className="block font-bold text-[#1C2434] dark:text-white mb-1 text-xs">
              Lọc theo Danh mục
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full p-2.5 bg-[#F1F5F9] dark:bg-[#10172A] border border-[#E2E8F0] dark:border-[#2E3A47] rounded-md text-xs text-[#1C2434] dark:text-white focus:outline-none focus:border-[#3C50E0]"
            >
              <option value="">Tất cả danh mục ({categories.length})</option>
              {categories.map((cat, idx) => (
                <option key={idx} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </AdminJSFilterDrawer>

      {/* Crawled Record Detail Drawer */}
      {detailProduct && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-lg bg-white dark:bg-[#1E293B] h-full shadow-2xl border-l border-[#E2E8F0] dark:border-[#2E3A47] flex flex-col justify-between animate-in slide-in-from-right duration-200 text-xs">
            <div className="p-5 border-b border-[#E2E8F0] dark:border-[#2E3A47] bg-[#1C2434] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-[#80CAEE]" />
                <h3 className="font-bold text-sm">Crawled Record Detail</h3>
              </div>
              <button
                onClick={() => setDetailProduct(null)}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 bg-[#24303F] rounded"
              >
                Đóng
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1 text-[#1C2434] dark:text-slate-200">
              <h4 className="font-bold text-sm text-[#3C50E0] dark:text-[#80CAEE]">{detailProduct.name}</h4>

              {detailProduct.images && detailProduct.images[0] && (
                <div className="flex justify-center p-4 bg-[#F1F5F9] dark:bg-[#10172A] rounded-xl border border-[#E2E8F0] dark:border-[#2E3A47]">
                  <img
                    src={detailProduct.images[0]}
                    alt={detailProduct.name}
                    className="max-h-48 object-contain rounded-md"
                  />
                </div>
              )}

              <div className="space-y-2 bg-[#F7F9FC] dark:bg-[#10172A] p-4 rounded-xl border border-[#E2E8F0] dark:border-[#2E3A47]">
                <p>
                  <strong className="text-slate-500">Mã ID:</strong> <span className="font-mono">{detailProduct.id}</span>
                </p>
                <p>
                  <strong className="text-slate-500">Danh mục:</strong> {detailProduct.category}
                </p>
                <p>
                  <strong className="text-slate-500">Giá niêm yết:</strong>{" "}
                  <span className="font-mono font-bold">
                    {detailProduct.price > 0 ? `${new Intl.NumberFormat("vi-VN").format(detailProduct.price)}đ` : "Liên hệ"}
                  </span>
                </p>
                <p>
                  <strong className="text-slate-500">URL Nguồn Crawl:</strong>{" "}
                  <a
                    href={detailProduct.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#3C50E0] dark:text-[#80CAEE] hover:underline inline-flex items-center gap-1 font-mono text-[11px]"
                  >
                    <span>{detailProduct.url}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </p>
              </div>

              {detailProduct.specifications && Object.keys(detailProduct.specifications).length > 0 && (
                <div className="space-y-2">
                  <h5 className="font-bold text-xs text-[#1C2434] dark:text-white uppercase tracking-wider">Thông Số Kỹ Thuật Crawled Specs:</h5>
                  <div className="bg-[#F7F9FC] dark:bg-[#10172A] p-3 rounded-xl border border-[#E2E8F0] dark:border-[#2E3A47] divide-y divide-[#E2E8F0] dark:divide-[#2E3A47]">
                    {Object.entries(detailProduct.specifications).map(([key, val], idx) => (
                      <div key={idx} className="py-1.5 flex justify-between gap-4">
                        <span className="font-bold text-slate-500">{key}:</span>
                        <span className="text-right text-[#1C2434] dark:text-slate-200">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {detailProduct.description && (
                <div className="space-y-1">
                  <h5 className="font-bold text-xs text-[#1C2434] dark:text-white uppercase tracking-wider">Mô Tả Sản Phẩm Crawled:</h5>
                  <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400 bg-[#F7F9FC] dark:bg-[#10172A] p-3 rounded-xl border border-[#E2E8F0] dark:border-[#2E3A47]">
                    {detailProduct.description}
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-[#E2E8F0] dark:border-[#2E3A47] text-right bg-[#F7F9FC] dark:bg-[#24303F]">
              <button
                onClick={() => setDetailProduct(null)}
                className="px-4 py-2 bg-[#3C50E0] text-white font-bold text-xs rounded-lg hover:bg-[#3C50E0]/90 transition"
              >
                Đóng Chi Tiết Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
