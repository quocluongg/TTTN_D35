"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminProductService } from "@/services/admin/adminProductService";
import { adminCategoryService } from "@/services/admin/adminCategoryService";
import { notifySuccess, notifyError } from "@/components/Notify";
import StatusBadge from "@/components/StatusBadge";
import ConfirmDialog from "@/components/ConfirmDialog";
import { 
  Plus, 
  Search, 
  Edit3, 
  Eye, 
  Package, 
  Tag, 
  Layers, 
  Star, 
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Sliders
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Any = Record<string, any>;
const unwrap = (x: any) => x?.data ?? x;

export default function AdminProductsPage() {
  const queryClient = useQueryClient();

  // Filters State
  const [search, setSearch] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [brand, setBrand] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);

  // Quick View Variants & Specifications Modal State
  const [selectedProduct, setSelectedProduct] = useState<Any | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [modalActiveTab, setModalActiveTab] = useState<"VARIANTS" | "SPECS">("VARIANTS");

  // Status Toggle Confirm State
  const [toggleProduct, setToggleProduct] = useState<Any | null>(null);

  // Query Categories for Filter
  const categoriesQuery = useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => adminCategoryService.list(),
  });
  const categories: Any[] = unwrap(categoriesQuery.data)?.items || unwrap(categoriesQuery.data)?.content || unwrap(categoriesQuery.data) || [];

  // Query Admin Products List
  const productsQuery = useQuery({
    queryKey: ["admin-products", search, categorySlug, brand, statusFilter, page, size],
    queryFn: () =>
      adminProductService.list({
        search: search || undefined,
        categorySlug: categorySlug || undefined,
        brand: brand || undefined,
        page,
        size,
      }),
  });

  // Query full product detail including specifications when Quick View modal opens
  const modalDetailQuery = useQuery({
    queryKey: ["admin-product-modal-detail", selectedProduct?.id],
    queryFn: () => adminProductService.get(selectedProduct!.id),
    enabled: !!selectedProduct?.id && detailModalOpen,
  });

  const fullDetail: Any = unwrap(modalDetailQuery.data) || selectedProduct;
  const modalSpecs: Any[] = fullDetail?.specifications || [];

  const payload: Any = unwrap(productsQuery.data) || {};
  const rawRows: Any[] = payload.items || payload.content || (Array.isArray(payload) ? payload : []);
  const totalPages = payload.pagination?.totalPages ?? payload.totalPages ?? 1;
  const totalElements = payload.pagination?.totalItems ?? payload.totalElements ?? rawRows.length;

  // Filter Status locally if needed
  const rows = rawRows.filter((item) => {
    if (statusFilter === "ACTIVE") return item.isActive === true || item.active === true;
    if (statusFilter === "INACTIVE") return item.isActive === false || item.active === false;
    return true;
  });

  const handleStatusFilterChange = (val: string) => {
    setStatusFilter(val);
    setPage(0);
  };

  // Mutation: Toggle Active/Inactive Status
  const toggleStatusMutation = useMutation({
    mutationFn: (prod: Any) =>
      adminProductService.status(prod.id, { active: !prod.isActive }),
    onSuccess: () => {
      notifySuccess("Cập nhật trạng thái sản phẩm thành công!");
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      setToggleProduct(null);
    },
    onError: (err: any) => {
      notifyError(err?.response?.data?.message || "Không thể thay đổi trạng thái sản phẩm");
    },
  });

  // Calculate Smart Metrics from loaded items
  const avgPrice = rawRows.length > 0 
    ? Math.round(rawRows.reduce((sum, r) => sum + (Number(r.priceFrom || r.price || 0)), 0) / rawRows.length)
    : 0;

  const topRatedProduct = rawRows.length > 0
    ? [...rawRows].sort((a, b) => Number(b.ratingAvg ?? 5) - Number(a.ratingAvg ?? 5))[0]
    : null;
  const topRatingVal = topRatedProduct?.ratingAvg ? Number(topRatedProduct.ratingAvg).toFixed(1) : "5.0";

  const totalOutOfStock = rawRows.reduce((acc, r) => {
    const outOfStockCount = r.variants ? r.variants.filter((v: Any) => Number(v.stock || 0) === 0).length : 0;
    return acc + outOfStockCount;
  }, 0);

  return (
    <div className="space-y-6 font-sans">
      {/* ===== HEADER & TOP ACTION ===== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Quản Lý Sản Phẩm Kho hàng</h1>
          <p className="text-xs text-zinc-500 mt-1 font-mono">
            Tổng số: <strong className="text-zinc-900 dark:text-white">{totalElements}</strong> sản phẩm trong kho hệ thống.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => productsQuery.refetch()}
            className="p-2.5 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            title="Tải lại danh sách"
          >
            <RefreshCw className={`w-4 h-4 text-zinc-600 dark:text-zinc-400 ${productsQuery.isFetching ? "animate-spin" : ""}`} />
          </button>
          <Link
            href="/admin/products/new"
            className="bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 px-4 py-2.5 text-xs font-bold rounded-lg flex items-center gap-2 transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" /> Thêm sản phẩm mới
          </Link>
        </div>
      </div>

      {/* ===== SMART METRICS DASHBOARD ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[11px] font-semibold text-zinc-400 uppercase">Tổng sản phẩm</span>
            <div className="text-2xl font-bold font-mono text-zinc-900 dark:text-white mt-0.5">{totalElements}</div>
          </div>
          <Package className="w-7 h-7 text-zinc-300 dark:text-zinc-700" />
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[11px] font-semibold text-zinc-400 uppercase">Giá trung bình</span>
            <div className="text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-0.5">
              {avgPrice > 0 ? `${avgPrice.toLocaleString("vi-VN")} ₫` : "—"}
            </div>
          </div>
          <Tag className="w-7 h-7 text-zinc-300 dark:text-zinc-700" />
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[11px] font-semibold text-zinc-400 uppercase">Đánh giá cao nhất</span>
            <div className="text-2xl font-bold font-mono text-amber-500 mt-0.5 flex items-center gap-1">
              {topRatingVal} <span className="text-xs font-mono text-zinc-400 font-normal">/ 5.0</span>
            </div>
            {topRatedProduct && (
              <span className="text-[11px] text-zinc-500 font-medium truncate block max-w-[140px] mt-0.5" title={topRatedProduct.name}>
                Top: {topRatedProduct.name}
              </span>
            )}
          </div>
          <Star className="w-7 h-7 text-amber-400 fill-amber-400 shrink-0" />
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[11px] font-semibold text-zinc-400 uppercase">Tồn kho 0 (Cần nạp)</span>
            <div className={`text-2xl font-bold font-mono mt-0.5 ${totalOutOfStock > 0 ? "text-red-600" : "text-emerald-600"}`}>
              {totalOutOfStock}
            </div>
          </div>
          <Layers className="w-7 h-7 text-zinc-300 dark:text-zinc-700" />
        </div>
      </div>

      {/* ===== SEARCH & FILTERS BAR ===== */}
      <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-4 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên sản phẩm, hãng..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
          </div>

          {/* Filter Category */}
          <select
            value={categorySlug}
            onChange={(e) => {
              setCategorySlug(e.target.value);
              setPage(0);
            }}
            className="px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm font-medium focus:outline-none focus:border-indigo-500 shrink-0"
          >
            <option value="">Tất cả danh mục</option>
            {categories.map((c: Any) => (
              <option key={c.id || c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Filter Brand */}
          <select
            value={brand}
            onChange={(e) => {
              setBrand(e.target.value);
              setPage(0);
            }}
            className="px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm font-medium focus:outline-none focus:border-indigo-500 shrink-0"
          >
            <option value="">Tất cả thương hiệu</option>
            <option value="ASUS">ASUS</option>
            <option value="MSI">MSI</option>
            <option value="Lenovo">Lenovo</option>
            <option value="Dell">Dell</option>
            <option value="HP">HP</option>
            <option value="Apple">Apple</option>
            <option value="Acer">Acer</option>
            <option value="DJI">DJI</option>
          </select>

          {/* Status Tabs Filter */}
          <div className="flex items-center rounded-lg border border-zinc-200 dark:border-zinc-700 p-1 bg-zinc-100/70 dark:bg-zinc-800 shrink-0">
            {["ALL", "ACTIVE", "INACTIVE"].map((st) => (
              <button
                key={st}
                onClick={() => handleStatusFilterChange(st)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  statusFilter === st
                    ? "bg-white text-zinc-900 shadow-2xs dark:bg-zinc-700 dark:text-white"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                }`}
              >
                {st === "ALL" ? "Tất cả" : st === "ACTIVE" ? "Đang bán" : "Tạm ẩn"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ===== PRODUCTS MAIN TABLE ===== */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-xs">
        {productsQuery.isLoading ? (
          <div className="p-12 text-center text-xs font-medium text-zinc-500 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-zinc-400" /> Đang tải danh sách sản phẩm...
          </div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Package className="w-9 h-9 text-zinc-300 mx-auto" />
            <p className="text-xs font-semibold text-zinc-500">Không tìm thấy sản phẩm phù hợp điều kiện lọc.</p>
            <button
              onClick={() => {
                setSearch("");
                setCategorySlug("");
                setBrand("");
                setStatusFilter("ALL");
              }}
              className="text-xs font-semibold text-indigo-600 hover:underline"
            >
              Xóa các bộ lọc
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50/70 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 uppercase text-[11px] font-bold tracking-wider text-zinc-500">
                  <th className="p-3.5 w-16 text-center">Ảnh</th>
                  <th className="p-3.5">Tên sản phẩm</th>
                  <th className="p-3.5">Danh mục & Hãng</th>
                  <th className="p-3.5">Giá bán khoảng</th>
                  <th className="p-3.5 text-center">Biến thể</th>
                  <th className="p-3.5 text-center">Trạng thái</th>
                  <th className="p-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 font-sans">
                {rows.map((row: Any) => {
                  const active = row.isActive !== false && row.active !== false;
                  const priceMin = row.priceFrom || row.price || 0;
                  const priceMax = row.priceTo;
                  const variantCount = row.variants?.length || 0;

                  return (
                    <tr
                      key={row.id}
                      className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 transition-colors"
                    >
                      {/* Image */}
                      <td className="p-3 text-center">
                        <div className="w-11 h-11 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 relative mx-auto overflow-hidden">
                          {row.thumbnail ? (
                            <img
                              src={row.thumbnail}
                              alt={row.name}
                              className="w-full h-full object-contain p-1"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-300">
                              <Package className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Name & Origin */}
                      <td className="p-3 space-y-1">
                        <Link
                          href={`/admin/products/${row.id}/edit`}
                          className="font-bold text-sm text-zinc-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors line-clamp-2"
                        >
                          {row.name}
                        </Link>
                        <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-mono">
                          <span>Origin: {row.origin || "Chính hãng"}</span>
                          <span>•</span>
                          <span>BH: {row.warrantyMonths || 24} thg</span>
                        </div>
                      </td>

                      {/* Category & Brand */}
                      <td className="p-3 space-y-0.5">
                        <span className="font-bold text-zinc-800 dark:text-zinc-200 block text-xs">
                          {row.brand || "—"}
                        </span>
                        <span className="text-[11px] text-zinc-500 block">
                          {row.categoryName || row.category?.name || "—"}
                        </span>
                      </td>

                      {/* Price Range */}
                      <td className="p-3 font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400">
                        {priceMin > 0 ? (
                          priceMax && priceMax > priceMin ? (
                            `${priceMin.toLocaleString("vi-VN")} - ${priceMax.toLocaleString("vi-VN")} ₫`
                          ) : (
                            `${priceMin.toLocaleString("vi-VN")} ₫`
                          )
                        ) : (
                          "Liên hệ"
                        )}
                      </td>

                      {/* Variant Count */}
                      <td className="p-3 text-center">
                        <button
                          onClick={() => {
                            setSelectedProduct(row);
                            setModalActiveTab("VARIANTS");
                            setDetailModalOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 hover:border-zinc-400 transition-colors"
                          title="Xem chi tiết biến thể & thông số"
                        >
                          {variantCount} biến thể
                        </button>
                      </td>

                      {/* Status */}
                      <td className="p-3 text-center">
                        <button
                          onClick={() => setToggleProduct(row)}
                          className="focus:outline-none"
                          title="Bấm để thay đổi trạng thái"
                        >
                          <StatusBadge status={active ? "ACTIVE" : "INACTIVE"} />
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick View Variants */}
                          <button
                            onClick={() => {
                              setSelectedProduct(row);
                              setModalActiveTab("VARIANTS");
                              setDetailModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                            title="Xem chi tiết"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit Button */}
                          <Link
                            href={`/admin/products/${row.id}/edit`}
                            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                            title="Chỉnh sửa"
                          >
                            <Edit3 className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ===== PAGINATION FOOTER ===== */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-800/40">
          <div className="text-xs text-zinc-500 font-mono">
            Trang <strong className="text-zinc-900 dark:text-white">{page + 1}</strong> / {totalPages} (Tổng {totalElements} kết quả)
          </div>

          <div className="flex items-center gap-1.5">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="p-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 disabled:opacity-30 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="p-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 disabled:opacity-30 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ===== QUICK VIEW & SPECIFICATIONS DIALOG MODAL ===== */}
      {detailModalOpen && selectedProduct && (
        <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
          <DialogContent className="max-w-4xl rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-5 shadow-xl">
            
            {/* Modal Header */}
            <DialogHeader>
              <DialogTitle className="text-lg font-bold flex items-center gap-2 text-zinc-900 dark:text-white">
                <Package className="w-5 h-5 text-indigo-600" />
                <span>{fullDetail.name || selectedProduct.name}</span>
              </DialogTitle>
            </DialogHeader>

            {/* General Meta Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-zinc-50 dark:bg-zinc-800 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-700">
              <div>
                <span className="text-[11px] text-zinc-400 block font-semibold uppercase">THƯƠNG HIỆU</span>
                <strong className="text-zinc-900 dark:text-white">{fullDetail.brand || selectedProduct.brand || "—"}</strong>
              </div>
              <div>
                <span className="text-[11px] text-zinc-400 block font-semibold uppercase">DANH MỤC</span>
                <strong className="text-zinc-900 dark:text-white">{fullDetail.categoryName || selectedProduct.categoryName || "—"}</strong>
              </div>
              <div>
                <span className="text-[11px] text-zinc-400 block font-semibold uppercase">XUẤT XỨ</span>
                <strong className="text-zinc-900 dark:text-white">{fullDetail.origin || selectedProduct.origin || "Chính hãng"}</strong>
              </div>
              <div>
                <span className="text-[11px] text-zinc-400 block font-semibold uppercase">BẢO HÀNH</span>
                <strong className="text-zinc-900 dark:text-white">{fullDetail.warrantyMonths || selectedProduct.warrantyMonths || 24} Tháng</strong>
              </div>
            </div>

            {/* Tabs Selector: VARIANTS vs SPECS */}
            <div className="flex border-b border-zinc-200 dark:border-zinc-700 gap-2">
              <button
                type="button"
                onClick={() => setModalActiveTab("VARIANTS")}
                className={`px-4 py-2 text-xs font-semibold flex items-center gap-2 border-b-2 -mb-[1px] transition-colors ${
                  modalActiveTab === "VARIANTS"
                    ? "border-zinc-900 text-zinc-900 dark:border-white dark:text-white"
                    : "border-transparent text-zinc-400 hover:text-zinc-700"
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Biến thể & Tồn kho ({fullDetail.variants?.length || 0})</span>
              </button>

              <button
                type="button"
                onClick={() => setModalActiveTab("SPECS")}
                className={`px-4 py-2 text-xs font-semibold flex items-center gap-2 border-b-2 -mb-[1px] transition-colors ${
                  modalActiveTab === "SPECS"
                    ? "border-zinc-900 text-zinc-900 dark:border-white dark:text-white"
                    : "border-transparent text-zinc-400 hover:text-zinc-700"
                }`}
              >
                <Sliders className="w-4 h-4" />
                <span>Thông số kỹ thuật ({modalSpecs.length})</span>
              </button>
            </div>

            {/* TAB 1: VARIANTS TABLE */}
            {modalActiveTab === "VARIANTS" && (
              <div>
                {fullDetail.variants && fullDetail.variants.length > 0 ? (
                  <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-x-auto max-h-[350px]">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-800 font-mono text-zinc-500">
                          <th className="p-2.5">Màu sắc</th>
                          <th className="p-2.5">Cấu hình / Thuộc tính</th>
                          <th className="p-2.5 text-right">Giá bán</th>
                          <th className="p-2.5 text-center">Tồn kho</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                        {fullDetail.variants.map((v: Any, i: number) => {
                          const attrStr = v.attributes ? Object.values(v.attributes).filter(Boolean).join(" · ") : "";
                          return (
                            <tr key={v.id || i}>
                              <td className="p-2.5 font-bold">{v.color || "Tiêu chuẩn"}</td>
                              <td className="p-2.5 text-zinc-600 dark:text-zinc-300">
                                {attrStr || [v.cpu, v.ram, v.ssd, v.vga].filter(Boolean).join(" · ") || "—"}
                              </td>
                              <td className="p-2.5 text-right font-bold font-mono text-indigo-600">
                                {Number(v.price || 0).toLocaleString("vi-VN")} ₫
                              </td>
                              <td className="p-2.5 text-center">
                                <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-md ${v.stock > 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                                  {v.stock > 0 ? `${v.stock} chiếc` : "Hết hàng"}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500 italic p-4 text-center">Chưa có thông tin biến thể.</p>
                )}
              </div>
            )}

            {/* TAB 2: EAV SPECIFICATIONS TABLE */}
            {modalActiveTab === "SPECS" && (
              <div>
                {modalDetailQuery.isLoading ? (
                  <div className="p-8 text-center text-xs font-mono text-zinc-500 flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" /> Đang tải thông số kỹ thuật...
                  </div>
                ) : modalSpecs.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl space-y-1">
                    <Sliders className="w-7 h-7 mx-auto text-zinc-400" />
                    <p className="text-xs font-semibold text-zinc-500">Sản phẩm này chưa có dữ liệu Thông số kỹ thuật EAV.</p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-x-auto max-h-[350px]">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-800 font-mono text-zinc-500">
                          <th className="p-2.5 w-1/4">Nhóm</th>
                          <th className="p-2.5 w-1/4">Thuộc tính</th>
                          <th className="p-2.5 w-1/3">Giá trị</th>
                          <th className="p-2.5 text-center">Đơn vị</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                        {modalSpecs.map((s: Any, i: number) => (
                          <tr key={s.id || i} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                            <td className="p-2.5 font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                              {s.specGroup || "Thông số chung"}
                            </td>
                            <td className="p-2.5 font-bold text-zinc-900 dark:text-zinc-100">
                              {s.attributeDisplayName || s.attributeName}
                            </td>
                            <td className="p-2.5 font-medium text-zinc-700 dark:text-zinc-300">
                              {s.specValue}
                            </td>
                            <td className="p-2.5 text-center font-mono text-zinc-400">
                              {s.specUnit || "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Modal Actions Footer */}
            <div className="flex justify-end gap-2.5 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setDetailModalOpen(false)}
                className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 text-xs font-semibold rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                Đóng
              </button>
              <Link
                href={`/admin/products/${selectedProduct.id}/edit`}
                className="bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 px-4 py-2 text-xs font-semibold rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors flex items-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" /> Chỉnh sửa sản phẩm
              </Link>
            </div>

          </DialogContent>
        </Dialog>
      )}

      {/* ===== TOGGLE STATUS CONFIRM DIALOG ===== */}
      <ConfirmDialog
        open={!!toggleProduct}
        onOpenChange={(v) => !v && setToggleProduct(null)}
        title={toggleProduct?.isActive !== false ? "Ẩn sản phẩm khỏi cửa hàng?" : "Kinh doanh lại sản phẩm?"}
        description={`Sản phẩm "${toggleProduct?.name}" sẽ ${toggleProduct?.isActive !== false ? "không hiển thị cho khách hàng mua sắm" : "được xuất hiện lại trên trang bán hàng"}.`}
        confirmText="Xác nhận"
        onConfirm={() => {
          if (toggleProduct) toggleStatusMutation.mutate(toggleProduct);
        }}
      />
    </div>
  );
}
