"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import PublicLayout from "@/shared/layouts/PublicLayout";
import {
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShoppingBag,
  ShieldCheck,
  ArrowLeft,
  Truck,
  RotateCcw,
} from "lucide-react";
import { useRouter } from "next/navigation";
import ConfirmDialog from "@/components/ConfirmDialog";
import {
  useCartQuery,
  useUpdateCartQuantity,
  useRemoveCartItem,
  useClearCart,
  type CartItem,
} from "@/hooks/useCart";

const QUANTITY_DEBOUNCE_MS = 500;

function formatCurrency(val: number) {
  return new Intl.NumberFormat("vi-VN").format(val) + "đ";
}

export default function CartPage() {
  const router = useRouter();
  const { data: cart, isLoading } = useCartQuery();
  const updateQuantityMutation = useUpdateCartQuantity();
  const removeItemMutation = useRemoveCartItem();
  const clearCartMutation = useClearCart();

  const items: CartItem[] = cart?.items ?? [];
  const totalItems = cart?.totalItems ?? 0;
  const subtotal = cart?.subtotal ?? 0;

  // Optimistic quantity hiển thị ngay khi bấm +/-, không đợi API - key theo cart item id.
  const [displayQty, setDisplayQty] = useState<Record<string, number>>({});
  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const [removingId, setRemovingId] = useState<string | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  const getQty = (item: CartItem) => displayQty[item.id] ?? item.quantity;

  const handleQuantityChange = (item: CartItem, nextQty: number) => {
    if (nextQty < 1 || nextQty > item.availableStock) return;

    setDisplayQty((prev) => ({ ...prev, [item.id]: nextQty }));

    if (debounceTimers.current[item.id]) {
      clearTimeout(debounceTimers.current[item.id]);
    }
    debounceTimers.current[item.id] = setTimeout(() => {
      updateQuantityMutation.mutate(
        { id: item.id, quantity: nextQty },
        {
          onSettled: () => {
            setDisplayQty((prev) => {
              const next = { ...prev };
              delete next[item.id];
              return next;
            });
          },
        }
      );
    }, QUANTITY_DEBOUNCE_MS);
  };

  const confirmRemove = () => {
    if (!removingId) return;
    removeItemMutation.mutate(removingId, {
      onSettled: () => setRemovingId(null),
    });
  };

  const handleClearAll = () => {
    clearCartMutation.mutate(undefined, {
      onSettled: () => setConfirmClearAll(false),
    });
  };

  return (
    <PublicLayout fullWidth>
      <div className="w-full min-h-screen bg-[#F5F5F7] dark:bg-zinc-950 text-black dark:text-white transition-colors duration-300 font-sans">

        {/* BREADCRUMB & HEADER SECTION */}
        <section className="w-full border-b border-black dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6 py-6 lg:px-12">
          <div className="w-[1920px] max-w-full mx-auto flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 mb-2">
                <Link href="/" className="hover:text-black dark:hover:text-white">Trang chủ</Link>
                <span>/</span>
                <span className="text-black dark:text-white font-bold">Giỏ hàng ({totalItems})</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Giỏ hàng công nghệ của bạn</h1>
            </div>

            <div className="flex items-center gap-4">
              <Link
                href="/shop"
                className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 px-4 py-2 border border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
              >
                <ArrowLeft size={14} /> Tiếp tục mua sắm
              </Link>
              {items.length > 0 && (
                <button
                  onClick={() => setConfirmClearAll(true)}
                  className="text-xs font-semibold text-red-600 hover:text-red-700 underline flex items-center gap-1"
                >
                  <Trash2 size={14} /> Xóa tất cả
                </button>
              )}
            </div>
          </div>
        </section>

        {/* MAIN CART CONTENT */}
        <section className="w-full border-b border-black dark:border-zinc-800">
          <div className="w-[1920px] max-w-full mx-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-black dark:divide-zinc-800">

            {/* LEFT COLUMN: CART ITEMS LIST (8 COLS) */}
            <div className="lg:col-span-8 p-6 lg:p-12 bg-white dark:bg-zinc-900 min-h-[550px] flex flex-col justify-between">
              {isLoading ? (
                <p className="text-sm text-zinc-500 py-20 text-center">Đang tải giỏ hàng…</p>
              ) : items.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-20 my-auto space-y-5">
                  <div className="w-24 h-24 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center border border-black/10">
                    <ShoppingBag className="w-12 h-12 text-zinc-400" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Giỏ hàng của bạn đang trống</h2>
                  <p className="text-sm text-zinc-500 max-w-md leading-relaxed">
                    Bạn chưa chọn sản phẩm nào vào giỏ. Hãy dạo quanh cửa hàng ShopWise để tìm chiếc laptop hay phụ kiện ưng ý nhé!
                  </p>
                  <Link
                    href="/shop"
                    className="mt-2 inline-flex items-center gap-2 bg-black text-white dark:bg-white dark:text-black px-8 py-3.5 font-bold text-sm hover:bg-[#C5FA1F] hover:text-black transition-all border border-black uppercase tracking-wider"
                  >
                    Khám phá Cửa Hàng ngay <ArrowRight size={16} />
                  </Link>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Table Header */}
                  <div className="hidden sm:grid grid-cols-12 text-xs font-bold uppercase tracking-wider text-zinc-500 pb-3 border-b border-black dark:border-zinc-800">
                    <div className="col-span-6">Sản phẩm & Cấu hình</div>
                    <div className="col-span-2 text-center">Đơn giá</div>
                    <div className="col-span-2 text-center">Số lượng</div>
                    <div className="col-span-2 text-right">Thành tiền</div>
                  </div>

                  {/* Items list */}
                  <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {items.map((item) => {
                      const qty = getQty(item);
                      const effectivePrice = item.salePrice ?? item.price;
                      const lineTotal = effectivePrice * qty;
                      const overStock = qty > item.availableStock;

                      return (
                        <div key={item.id} className="py-6 grid grid-cols-1 sm:grid-cols-12 gap-4 items-center group">

                          {/* Product Info (6 cols) */}
                          <div className="sm:col-span-6 flex items-start sm:items-center gap-4">
                            <div className="relative w-24 h-24 bg-zinc-50 dark:bg-zinc-800 border border-black/10 shrink-0 p-2 overflow-hidden">
                              <Image
                                src={item.image || "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/Laptop_d170e53d32.png"}
                                alt={item.productName}
                                fill
                                className="object-contain p-1 group-hover:scale-105 transition-transform"
                              />
                            </div>
                            <div className="space-y-1">
                              <Link href={`/product/${item.productSlug || item.productId}`} className="font-extrabold text-base hover:underline line-clamp-2 leading-snug">
                                {item.productName}
                              </Link>
                              <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 font-mono">
                                <span className="bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 border border-zinc-300 dark:border-zinc-700 text-black dark:text-white font-semibold">
                                  {item.variantName || "Mặc định"}
                                </span>
                              </div>
                              {overStock && (
                                <p className="text-xs text-red-600 font-semibold">
                                  Chỉ còn {item.availableStock} sản phẩm trong kho
                                </p>
                              )}
                              <button
                                onClick={() => setRemovingId(item.id)}
                                className="text-xs text-red-600 hover:text-red-700 font-bold flex items-center gap-1 pt-1 hover:underline"
                              >
                                <Trash2 size={13} /> Xóa khỏi giỏ
                              </button>
                            </div>
                          </div>

                          {/* Price (2 cols) */}
                          <div className="sm:col-span-2 text-left sm:text-center font-bold text-sm">
                            <span className="sm:hidden text-xs text-zinc-400 font-normal">Đơn giá: </span>
                            {item.salePrice ? (
                              <span className="flex flex-col sm:items-center">
                                <span className="text-red-600">{formatCurrency(item.salePrice)}</span>
                                <span className="text-xs text-zinc-400 line-through font-normal">{formatCurrency(item.price)}</span>
                              </span>
                            ) : (
                              formatCurrency(item.price)
                            )}
                          </div>

                          {/* Quantity Controls (2 cols) */}
                          <div className="sm:col-span-2 flex items-center justify-start sm:justify-center">
                            <div className="flex items-center border border-black dark:border-white bg-white dark:bg-zinc-800">
                              <button
                                onClick={() => handleQuantityChange(item, qty - 1)}
                                disabled={qty <= 1}
                                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                title="Giảm số lượng"
                              >
                                <Minus size={14} />
                              </button>
                              <span className="px-4 py-1.5 text-xs font-bold font-mono">{qty}</span>
                              <button
                                onClick={() => handleQuantityChange(item, qty + 1)}
                                disabled={qty >= item.availableStock}
                                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                title="Tăng số lượng"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          </div>

                          {/* Total Line (2 cols) */}
                          <div className="sm:col-span-2 text-left sm:text-right font-black text-base text-indigo-700 dark:text-indigo-400">
                            <span className="sm:hidden text-xs text-zinc-400 font-normal">Thành tiền: </span>
                            {formatCurrency(lineTotal)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Service Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8 mt-8 border-t border-black/10 dark:border-zinc-800">
                <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
                  <Truck className="w-6 h-6 text-indigo-600 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold uppercase">Miễn phí vận chuyển</h4>
                    <p className="text-[11px] text-zinc-500">Đơn hàng từ 1.000.000đ</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
                  <RotateCcw className="w-6 h-6 text-indigo-600 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold uppercase">1 Đổi 1 trong 30 ngày</h4>
                    <p className="text-[11px] text-zinc-500">Nếu phát sinh lỗi NSX</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
                  <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold uppercase">Bảo hành chính hãng</h4>
                    <p className="text-[11px] text-zinc-500">Cam kết 100% linh kiện chuẩn</p>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: ORDER SUMMARY (4 COLS) */}
            <div className="lg:col-span-4 p-6 lg:p-12 bg-zinc-50 dark:bg-zinc-900/50 flex flex-col justify-between space-y-8">
              <div className="space-y-6">
                <h2 className="text-xl font-extrabold tracking-tight border-b border-black dark:border-zinc-800 pb-4">
                  Tóm tắt đơn hàng
                </h2>

                {/* Ghi chú: mã giảm giá được áp dụng ở bước Thanh toán (voucher tính theo tổng
                    tiền hàng không sale của toàn đơn), không áp ở trang Giỏ hàng. */}
                <div className="space-y-3 text-sm pt-4 border-t border-black/10 dark:border-zinc-800">
                  <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                    <span>Tổng số lượng món:</span>
                    <strong className="text-black dark:text-white font-mono">{totalItems} sản phẩm</strong>
                  </div>

                  <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                    <span>Phí vận chuyển:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold uppercase text-xs">Freeship toàn quốc</span>
                  </div>

                  <div className="pt-4 border-t border-black dark:border-zinc-800 flex items-baseline justify-between">
                    <div>
                      <span className="text-base font-extrabold block">Tạm tính:</span>
                      <span className="text-[11px] text-zinc-500">Chưa gồm mã giảm giá</span>
                    </div>
                    <span className="text-2xl sm:text-3xl font-black text-indigo-700 dark:text-indigo-400">
                      {formatCurrency(subtotal)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Checkout Action Button */}
              <div className="space-y-3 pt-6 border-t border-black dark:border-zinc-800">
                <button
                  disabled={items.length === 0}
                  onClick={() => router.push("/checkout")}
                  className="w-full h-14 bg-black text-white dark:bg-white dark:text-black font-extrabold uppercase tracking-wider text-base border border-black flex items-center justify-center gap-2 hover:bg-[#C5FA1F] hover:text-black transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-sm"
                >
                  Tiến hành thanh toán ngay <ArrowRight size={18} />
                </button>
                <p className="text-[11px] text-zinc-500 text-center">
                  Bằng việc bấm đặt hàng, bạn đồng ý với các Điều khoản & Chính sách bảo mật của ShopWise.
                </p>
              </div>
            </div>

          </div>
        </section>

      </div>

      <ConfirmDialog
        open={!!removingId}
        onOpenChange={(open) => !open && setRemovingId(null)}
        title="Xóa sản phẩm khỏi giỏ hàng?"
        description="Sản phẩm sẽ được xóa khỏi giỏ hàng của bạn."
        confirmText="Xóa"
        danger
        onConfirm={confirmRemove}
      />

      <ConfirmDialog
        open={confirmClearAll}
        onOpenChange={setConfirmClearAll}
        title="Xóa toàn bộ giỏ hàng?"
        description="Toàn bộ sản phẩm trong giỏ hàng sẽ bị xóa, không thể hoàn tác."
        confirmText="Xóa tất cả"
        danger
        onConfirm={handleClearAll}
      />
    </PublicLayout>
  );
}
