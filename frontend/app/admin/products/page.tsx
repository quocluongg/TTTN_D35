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
  SlidersHorizontal, 
  Edit3, 
  Eye, 
  Package, 
  Tag, 
  Layers, 
  Star, 
  CheckCircle2, 
  XCircle, 
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Sparkles
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

  // Quick View Variants Modal State
  const [selectedProduct, setSelectedProduct] = useState<Any | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

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

  const topRated = rawRows.length > 0
    ? [...rawRows].sort((a, b) => (b.ratingAvg ?? 5) - (a.ratingAvg ?? 5))[0]?.name
    : "—";

  const totalOutOfStock = rawRows.reduce((acc, r) => {
    // If has variants, count variants with stock = 0
    const outOfStockCount = r.variants ? r.variants.filter((v: Any) => Number(v.stock || 0) === 0).length : 0;
    return acc + outOfStockCount;
  }, 0);

  return (
    <div className="space-y-6">
      {/* ===== HEADER & TOP ACTION ===== */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black dark:border-zinc-800 pb-5">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight uppercase flex items-center gap-2">
            <Package className="w-7 h-7 text-black dark:text-white" />
            <span>Quản Lý Sản Phẩm</span>
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Quản lý kho hàng, giá bán, danh mục, thương hiệu và trạng thái kinh doanh của cửa hàng.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => productsQuery.refetch()}
            className="p-2.5 border border-black dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 ${productsQuery.isFetching ? "animate-spin" : ""}`} />
          </button>

          <Link
            href="/admin/products/new"
            className="bg-black text-white dark:bg-white dark:text-black px-5 py-2.5 font-bold text-xs uppercase tracking-wider flex items-center gap-2 hover:bg-[#C5FA1F] hover:text-black transition-all border border-black shadow-xs"
          >
            <Plus size={16} /> Thêm sản phẩm mới
          </Link>
        </div>
      </div>

      {/* ===== KPI SUMMARY CARDS ===== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="border border-black dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
          <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Tổng sản phẩm hệ thống</p>
          <p className="mt-2 text-3xl font-extrabold">{totalElements}</p>
        </div>
        <div className="border border-black dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
          <p className="text-xs font-mono text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Giá bán trung bình (Trang)</p>
          <p className="mt-2 text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {avgPrice > 0 ? avgPrice.toLocaleString("vi-VN") + " ₫" : "—"}
          </p>
        </div>
        <div className="border border-black dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
          <p className="text-xs font-mono text-rose-600 dark:text-rose-400 uppercase tracking-wider">Biến thể hết hàng (Trang)</p>
          <p className="mt-2 text-3xl font-extrabold text-rose-600 dark:text-rose-400">{totalOutOfStock}</p>
        </div>
        <div className="border border-black dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
          <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Sản phẩm đánh giá tốt nhất</p>
          <p className="mt-2 text-xs font-bold truncate text-zinc-800 dark:text-zinc-200" title={topRated}>
            {topRated}
          </p>
        </div>
      </div>

      {/* ===== FILTER BAR ===== */}
      <div className="border border-black dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Tìm theo tên sản phẩm, thương hiệu..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              className="w-full pl-9 pr-4 py-2 text-sm border border-black dark:border-zinc-700 bg-[#F9F9F9] dark:bg-zinc-800 outline-none focus:border-lime-500"
            />
          </div>

          {/* Category Filter */}
          <select
            value={categorySlug}
            onChange={(e) => {
              setCategorySlug(e.target.value);
              setPage(0);
            }}
            className="px-3 py-2 text-sm border border-black dark:border-zinc-700 bg-white dark:bg-zinc-800 outline-none cursor-pointer"
          >
            <option value="">-- Tất cả danh mục --</option>
            {categories.map((cat) => (
              <option key={cat.id || cat.slug} value={cat.slug}>
                {cat.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => handleStatusFilterChange(e.target.value)}
            className="px-3 py-2 text-sm border border-black dark:border-zinc-700 bg-white dark:bg-zinc-800 outline-none cursor-pointer"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang kinh doanh</option>
            <option value="INACTIVE">Tạm ẩn</option>
          </select>
        </div>

        {(search || categorySlug || statusFilter !== "ALL") && (
          <button
            onClick={() => {
              setSearch("");
              setCategorySlug("");
              setBrand("");
              setStatusFilter("ALL");
              setPage(0);
            }}
            className="text-xs font-bold underline text-red-600 dark:text-red-400 hover:opacity-80"
          >
            Xóa bộ lọc
          </button>
        )}
      </div>

      {/* ===== PRODUCTS DATA TABLE ===== */}
      <div className="border border-black dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-black dark:border-zinc-800 bg-[#F2F2F2] dark:bg-zinc-800 text-xs font-mono uppercase tracking-wider">
              <th className="p-4 w-12 text-center">#</th>
              <th className="p-4 min-w-[280px]">Sản phẩm</th>
              <th className="p-4">Danh mục</th>
              <th className="p-4">Thương hiệu</th>
              <th className="p-4">Giá từ</th>
              <th className="p-4 text-center">Đánh giá</th>
              <th className="p-4 text-center">Trạng thái</th>
              <th className="p-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/10 dark:divide-zinc-800">
            {productsQuery.isLoading ? (
              <tr>
                <td colSpan={8} className="p-12 text-center text-zinc-500 font-medium">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                  Đang tải danh sách sản phẩm...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-12 text-center text-zinc-500">
                  Không tìm thấy sản phẩm nào phù hợp.
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => {
                const imgUrl = row.imageUrl || row.image || row.images?.[0]?.imageUrl || row.thumbnail || "/figma/product_1.png";
                const isItemActive = row.isActive !== false && row.active !== false;

                return (
                  <tr key={row.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    {/* Index */}
                    <td className="p-4 text-center font-mono text-zinc-400 text-xs">
                      {page * size + idx + 1}
                    </td>

                    {/* Product Main Info */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 border border-black/10 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-1 shrink-0 flex items-center justify-center">
                          <img
                            src={imgUrl}
                            alt={row.name}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/admin/products/${row.id}/edit`}
                            className="font-bold text-black dark:text-white hover:underline truncate block max-w-[260px]"
                            title={row.name}
                          >
                            {row.name}
                          </Link>
                          <span className="text-[11px] font-mono text-zinc-400 block truncate">
                            ID: {row.id?.substring(0, 8)}...
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="p-4 font-medium text-zinc-700 dark:text-zinc-300">
                      {row.categoryName || row.category?.name || "—"}
                    </td>

                    {/* Brand */}
                    <td className="p-4">
                      <span className="inline-block border border-black/20 dark:border-zinc-700 px-2 py-0.5 text-xs font-mono uppercase bg-zinc-100 dark:bg-zinc-800">
                        {row.brand || "—"}
                      </span>
                    </td>

                    {/* Price From */}
                    <td className="p-4 font-bold text-black dark:text-white font-mono">
                      {row.priceFrom != null
                        ? Number(row.priceFrom).toLocaleString("vi-VN") + " ₫"
                        : row.price != null
                        ? Number(row.price).toLocaleString("vi-VN") + " ₫"
                        : "—"}
                    </td>

                    {/* Rating */}
                    <td className="p-4 text-center">
                      <div className="inline-flex items-center gap-1 font-bold text-xs">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{row.ratingAvg != null ? Number(row.ratingAvg).toFixed(1) : "5.0"}</span>
                      </div>
                    </td>

                    {/* Active Status */}
                    <td className="p-4 text-center">
                      <button
                        onClick={() => setToggleProduct(row)}
                        className="cursor-pointer transition-transform hover:scale-105"
                        title="Bấm để đổi trạng thái"
                      >
                        <StatusBadge status={isItemActive ? "ACTIVE" : "INACTIVE"} />
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Quick View Variants */}
                        <button
                          onClick={() => {
                            setSelectedProduct(row);
                            setDetailModalOpen(true);
                          }}
                          className="p-1.5 border border-black dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
                          title="Xem nhanh chi tiết & biến thể"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Edit Button */}
                        <Link
                          href={`/admin/products/${row.id}/edit`}
                          className="p-1.5 border border-black dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-lime-400 hover:text-black transition-colors"
                          title="Chỉnh sửa sản phẩm"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ===== PAGINATION ===== */}
      <div className="flex flex-wrap items-center justify-between gap-4 border border-black dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
        <div className="flex items-center gap-4 text-xs font-mono text-zinc-500">
          <div>
            Hiển thị trang <strong className="text-black dark:text-white">{page + 1}</strong> / {totalPages} (Tổng <strong className="text-black dark:text-white">{totalElements}</strong> sản phẩm)
          </div>

          {/* Page Size Selector */}
          <div className="flex items-center gap-2">
            <span>Hiển thị:</span>
            <select
              value={size}
              onChange={(e) => {
                setSize(Number(e.target.value));
                setPage(0);
              }}
              className="px-2 py-1 border border-black dark:border-zinc-700 bg-white dark:bg-zinc-800 text-black dark:text-white font-mono cursor-pointer outline-none"
            >
              <option value={10}>10 / trang</option>
              <option value={20}>20 / trang</option>
              <option value={50}>50 / trang</option>
              <option value={100}>100 / trang</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="p-2 border border-black dark:border-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
            title="Trang trước"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Page Numbers */}
          {Array.from({ length: Math.min(5, totalPages) }, (_, idx) => {
            let pageNum = idx;
            if (totalPages > 5) {
              if (page > 2) {
                pageNum = Math.min(page - 2 + idx, totalPages - 5 + idx);
              }
            }
            return (
              <button
                key={pageNum}
                onClick={() => setPage(pageNum)}
                className={`w-8 h-8 font-mono text-xs border border-black dark:border-zinc-700 transition-colors ${
                  page === pageNum
                    ? "bg-black text-white dark:bg-white dark:text-black font-bold"
                    : "bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                }`}
              >
                {pageNum + 1}
              </button>
            );
          })}

          <button
            disabled={page + 1 >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="p-2 border border-black dark:border-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
            title="Trang sau"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ===== QUICK VIEW MODAL ===== */}
      {detailModalOpen && selectedProduct && (
        <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
          <DialogContent className="max-w-3xl border-2 border-black dark:border-zinc-700 bg-white dark:bg-zinc-900 p-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold uppercase tracking-tight flex items-center gap-2">
                <Package className="w-5 h-5" />
                <span>{selectedProduct.name}</span>
              </DialogTitle>
            </DialogHeader>

            <div className="mt-4 space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm bg-zinc-50 dark:bg-zinc-800 p-4 border border-black/10 dark:border-zinc-700">
                <div>
                  <span className="text-xs text-zinc-400 block font-mono">THƯƠNG HIỆU</span>
                  <strong>{selectedProduct.brand || "—"}</strong>
                </div>
                <div>
                  <span className="text-xs text-zinc-400 block font-mono">DANH MỤC</span>
                  <strong>{selectedProduct.categoryName || "—"}</strong>
                </div>
                <div>
                  <span className="text-xs text-zinc-400 block font-mono">XUẤT XỨ</span>
                  <strong>{selectedProduct.origin || "Chính hãng"}</strong>
                </div>
                <div>
                  <span className="text-xs text-zinc-400 block font-mono">BẢO HÀNH</span>
                  <strong>{selectedProduct.warrantyMonths || 12} Tháng</strong>
                </div>
              </div>

              {/* Variants List Table */}
              <div>
                <h4 className="text-sm font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  <span>Danh sách Biến thể ({selectedProduct.variants?.length || 0})</span>
                </h4>

                {selectedProduct.variants && selectedProduct.variants.length > 0 ? (
                  <div className="border border-black dark:border-zinc-800 overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="bg-zinc-100 dark:bg-zinc-800 border-b border-black dark:border-zinc-800 font-mono">
                          <th className="p-2.5">Màu</th>
                          <th className="p-2.5">Cấu hình (CPU / RAM / SSD)</th>
                          <th className="p-2.5 text-right">Giá bán</th>
                          <th className="p-2.5 text-center">Tồn kho</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/10 dark:divide-zinc-800">
                        {selectedProduct.variants.map((v: Any, i: number) => (
                          <tr key={v.id || i}>
                            <td className="p-2.5 font-bold">{v.color || "Tiêu chuẩn"}</td>
                            <td className="p-2.5 text-zinc-600 dark:text-zinc-300">
                              {[v.cpu, v.ram, v.ssd, v.vga].filter(Boolean).join(" · ") || "—"}
                            </td>
                            <td className="p-2.5 text-right font-bold font-mono">
                              {Number(v.price || 0).toLocaleString("vi-VN")} ₫
                            </td>
                            <td className="p-2.5 text-center">
                              <span className={`px-2 py-0.5 text-[10px] font-bold ${v.stock > 0 ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
                                {v.stock > 0 ? `${v.stock} chiếc` : "Hết hàng"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-zinc-500 italic">Chưa có thông tin biến thể.</p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-black/10 dark:border-zinc-800">
                <Link
                  href={`/admin/products/${selectedProduct.id}/edit`}
                  className="bg-black text-white dark:bg-white dark:text-black px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-lime-400 hover:text-black transition-colors"
                >
                  Chỉnh sửa sản phẩm này
                </Link>
              </div>
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
