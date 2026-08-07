"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import PublicLayout from "@/shared/layouts/PublicLayout";
import { useCart } from "@/hooks/useCart";
import {
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShoppingBag,
  ShieldCheck,
  Tag,
  ArrowLeft,
  Truck,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { notifySuccess } from "@/components/Notify";
import ConfirmDialog from "@/components/ConfirmDialog";

export default function CartPage() {
  const router = useRouter();
  const {
    items,
    totalItems,
    totalPrice,
    isLoading,
    updateQuantity,
    removeItem,
    clearCart,
    isUpdatingQuantity,
  } = useCart();

  const [promoCode, setPromoCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [promoSuccess, setPromoSuccess] = useState("");
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("vi-VN").format(val) + " ₫";
  };

  const finalPrice = Math.max(0, totalPrice - appliedDiscount);

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCode.trim()) return;

    if (promoCode.trim().toUpperCase() === "SHOPWISE10" || promoCode.trim().toUpperCase() === "WELCOME") {
      const discountVal = Math.round(totalPrice * 0.1);
      setAppliedDiscount(discountVal);
      setPromoSuccess("Áp dụng mã giảm giá 10% thành công!");
      notifySuccess("Đã áp dụng mã giảm giá 10%!");
    } else {
      setAppliedDiscount(0);
      setPromoSuccess("");
      notifySuccess("Mã giảm giá dùng thử: SHOPWISE10");
    }
  };

  return (
    <PublicLayout fullWidth>
      <div className="w-full min-h-screen bg-[#F5F5F7] text-black font-sans">
        
        {/* HEADER SECTION */}
        <section className="w-full border-b border-black bg-white px-6 py-6 lg:px-12">
          <div className="w-[1920px] max-w-full mx-auto flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 mb-2">
                <Link href="/" className="hover:text-black">Trang chủ</Link>
                <span>/</span>
                <span className="text-black font-bold">Giỏ hàng ({totalItems})</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Giỏ hàng của bạn</h1>
            </div>

            <div className="flex items-center gap-4">
              <Link
                href="/shop"
                className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 px-4 py-2 border border-black hover:bg-black hover:text-white transition-colors"
              >
                <ArrowLeft size={14} /> Tiếp tục mua sắm
              </Link>
              {items.length > 0 && (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="text-xs font-semibold text-red-600 hover:text-red-700 underline flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 size={14} /> Xóa tất cả
                </button>
              )}
            </div>
          </div>
        </section>

        {/* MAIN CART CONTENT */}
        <section className="w-full border-b border-black">
          <div className="w-[1920px] max-w-full mx-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-black">
            
            {/* LEFT COLUMN: ITEMS LIST */}
            <div className="lg:col-span-8 p-6 lg:p-12 bg-white min-h-[550px] flex flex-col justify-between">
              {isLoading ? (
                <div className="py-20 text-center text-zinc-500">Đang tải giỏ hàng...</div>
              ) : items.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-20 my-auto space-y-5">
                  <div className="w-24 h-24 bg-zinc-100 rounded-full flex items-center justify-center border border-black/10">
                    <ShoppingBag className="w-12 h-12 text-zinc-400" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Giỏ hàng của bạn đang trống</h2>
                  <p className="text-sm text-zinc-500 max-w-md leading-relaxed">
                    Bạn chưa chọn sản phẩm nào vào giỏ. Hãy dạo quanh cửa hàng để tìm chiếc laptop hay phụ kiện ưng ý nhé!
                  </p>
                  <Link
                    href="/shop"
                    className="mt-2 inline-flex items-center gap-2 bg-black text-white px-8 py-3.5 font-bold text-sm hover:bg-zinc-800 transition-all border border-black uppercase tracking-wider"
                  >
                    Khám phá Cửa Hàng ngay <ArrowRight size={16} />
                  </Link>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Table Header */}
                  <div className="hidden sm:grid grid-cols-12 text-xs font-bold uppercase tracking-wider text-zinc-500 pb-3 border-b border-black">
                    <div className="col-span-6">Sản phẩm & Cấu hình</div>
                    <div className="col-span-2 text-center">Đơn giá</div>
                    <div className="col-span-2 text-center">Số lượng</div>
                    <div className="col-span-2 text-right">Thành tiền</div>
                  </div>

                  {/* Items list */}
                  <div className="divide-y divide-zinc-200">
                    {items.map((item: any) => {
                      const itemPrice = Number(item.salePrice ?? item.price ?? 0);
                      const itemSubtotal = Number(item.subtotal ?? (itemPrice * Number(item.quantity || 1)));

                      return (
                        <div key={item.id || item.variantId} className="py-6 grid grid-cols-1 sm:grid-cols-12 gap-4 items-center group">
                          
                          {/* Product Info */}
                          <div className="sm:col-span-6 flex items-start sm:items-center gap-4">
                            <div className="relative w-20 h-20 bg-zinc-50 border border-black/10 shrink-0 p-2 overflow-hidden">
                              <Image
                                src={item.image || "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/Laptop_d170e53d32.png"}
                                alt={item.productName || item.name || "Sản phẩm"}
                                fill
                                className="object-contain p-1 group-hover:scale-105 transition-transform"
                              />
                            </div>
                            <div className="space-y-1">
                              <Link
                                href={`/product/${item.productSlug || item.productId}`}
                                className="font-bold text-base hover:underline line-clamp-2 leading-snug"
                              >
                                {item.productName || item.name}
                              </Link>
                              <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 font-mono">
                                <span className="bg-zinc-100 px-2 py-0.5 border border-zinc-300 text-black font-semibold">
                                  {item.variantName || "Mặc định"}
                                </span>
                              </div>
                              <button
                                onClick={() => setDeleteItemId(item.id || item.variantId)}
                                className="text-xs text-red-600 hover:text-red-700 font-bold flex items-center gap-1 pt-1 hover:underline cursor-pointer"
                              >
                                <Trash2 size={13} /> Xóa
                              </button>
                            </div>
                          </div>

                          {/* Price */}
                          <div className="sm:col-span-2 text-left sm:text-center font-bold text-sm">
                            <span className="sm:hidden text-xs text-zinc-400 font-normal">Đơn giá: </span>
                            {formatCurrency(itemPrice)}
                          </div>

                          {/* Quantity Controls */}
                          <div className="sm:col-span-2 flex items-center justify-start sm:justify-center">
                            <div className="flex items-center border border-black bg-white">
                              <button
                                disabled={isUpdatingQuantity || item.quantity <= 1}
                                onClick={() => updateQuantity({ id: item.id || item.variantId, quantity: item.quantity - 1 })}
                                className="p-2 hover:bg-zinc-100 transition-colors disabled:opacity-30"
                                title="Giảm số lượng"
                              >
                                <Minus size={14} />
                              </button>
                              <span className="px-3 py-1 text-xs font-bold font-mono">{item.quantity}</span>
                              <button
                                disabled={isUpdatingQuantity || (item.availableStock && item.quantity >= item.availableStock)}
                                onClick={() => updateQuantity({ id: item.id || item.variantId, quantity: item.quantity + 1 })}
                                className="p-2 hover:bg-zinc-100 transition-colors disabled:opacity-30"
                                title="Tăng số lượng"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          </div>

                          {/* Subtotal */}
                          <div className="sm:col-span-2 text-left sm:text-right font-black text-base text-black">
                            <span className="sm:hidden text-xs text-zinc-400 font-normal">Thành tiền: </span>
                            {formatCurrency(itemSubtotal)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Service Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8 mt-8 border-t border-black/10">
                <div className="flex items-center gap-3 p-3 bg-zinc-50 border border-zinc-200">
                  <Truck className="w-6 h-6 text-black shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold uppercase">Miễn phí vận chuyển</h4>
                    <p className="text-[11px] text-zinc-500">Đơn hàng toàn quốc</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-zinc-50 border border-zinc-200">
                  <RotateCcw className="w-6 h-6 text-black shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold uppercase">1 Đổi 1 trong 30 ngày</h4>
                    <p className="text-[11px] text-zinc-500">Lỗi từ nhà sản xuất</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-zinc-50 border border-zinc-200">
                  <ShieldCheck className="w-6 h-6 text-black shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold uppercase">Bảo hành chính hãng</h4>
                    <p className="text-[11px] text-zinc-500">Cam kết 100% chính hãng</p>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: SUMMARY */}
            <div className="lg:col-span-4 p-6 lg:p-12 bg-zinc-50 flex flex-col justify-between space-y-8">
              <div className="space-y-6">
                <h2 className="text-xl font-extrabold tracking-tight border-b border-black pb-4">
                  Tóm tắt đơn hàng
                </h2>

                {/* Promo Code Form */}
                <form onSubmit={handleApplyPromo} className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 flex items-center gap-1">
                    <Tag size={13} /> Mã giảm giá / Voucher
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      placeholder="Thử nhập: SHOPWISE10"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      className="flex-1 border border-black px-3 py-2 text-xs font-mono uppercase bg-white focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="bg-black text-white text-xs font-bold uppercase px-4 py-2 hover:bg-zinc-800 transition-colors border border-black border-l-0"
                    >
                      Áp dụng
                    </button>
                  </div>
                  {promoSuccess && (
                    <p className="text-xs text-green-700 font-bold flex items-center gap-1">
                      <CheckCircle2 size={12} /> {promoSuccess}
                    </p>
                  )}
                </form>

                {/* Summary Lines */}
                <div className="space-y-3 text-sm pt-4 border-t border-black/10">
                  <div className="flex justify-between text-zinc-600">
                    <span>Tổng số lượng:</span>
                    <strong className="text-black font-mono">{totalItems} món</strong>
                  </div>

                  <div className="flex justify-between text-zinc-600">
                    <span>Tạm tính tiền hàng:</span>
                    <strong className="text-black font-mono">{formatCurrency(totalPrice)}</strong>
                  </div>

                  {appliedDiscount > 0 && (
                    <div className="flex justify-between text-green-700 font-semibold">
                      <span>Mã giảm giá (10%):</span>
                      <span className="font-mono">-{formatCurrency(appliedDiscount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-zinc-600">
                    <span>Phí vận chuyển:</span>
                    <span className="text-green-700 font-bold uppercase text-xs">Freeship</span>
                  </div>
                  
                  <div className="pt-4 border-t border-black flex items-baseline justify-between">
                    <div>
                      <span className="text-base font-extrabold block">Tổng thanh toán:</span>
                      <span className="text-[11px] text-zinc-500">(Đã bao gồm VAT)</span>
                    </div>
                    <span className="text-2xl font-black text-black">
                      {formatCurrency(finalPrice)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="space-y-3 pt-6 border-t border-black">
                <button
                  disabled={items.length === 0}
                  onClick={() => router.push("/checkout")}
                  className="w-full h-14 bg-black text-white font-extrabold uppercase tracking-wider text-base border border-black flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Tiến hành thanh toán ngay <ArrowRight size={18} />
                </button>
              </div>
            </div>

          </div>
        </section>

      </div>

      {/* Confirm Dialog Xóa 1 item */}
      <ConfirmDialog
        open={!!deleteItemId}
        onOpenChange={(v) => !v && setDeleteItemId(null)}
        title="Xóa sản phẩm?"
        description="Bạn chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng?"
        danger
        confirmText="Xóa"
        onConfirm={() => {
          if (deleteItemId) removeItem(deleteItemId);
          setDeleteItemId(null);
        }}
      />

      {/* Confirm Dialog Xóa tất cả */}
      <ConfirmDialog
        open={showClearConfirm}
        onOpenChange={(v) => !v && setShowClearConfirm(false)}
        title="Làm trống giỏ hàng?"
        description="Bạn chắc chắn muốn xóa toàn bộ sản phẩm khỏi giỏ hàng?"
        danger
        confirmText="Xóa tất cả"
        onConfirm={() => {
          clearCart();
          setShowClearConfirm(false);
        }}
      />
    </PublicLayout>
  );
}
