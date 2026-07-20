"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import PublicLayout from "@/shared/layouts/PublicLayout";
import { ChevronRight, CheckCircle2, ShoppingBag, ArrowLeft, Tag, CreditCard, Truck, Check } from "lucide-react";

export default function CheckoutPage() {
  // Step State: 1 = 'info', 2 = 'shipping', 3 = 'payment', 4 = 'success'
  const [currentStep, setCurrentStep] = useState<"info" | "shipping" | "payment" | "success">("info");

  // Form Input States
  const [emailOrPhone, setEmailOrPhone] = useState("johndoe@example.com");
  const [firstName, setFirstName] = useState("John");
  const [lastName, setLastName] = useState("Doe");
  const [address, setAddress] = useState("120, Yên Lãng");
  const [apartment, setApartment] = useState("");
  const [city, setCity] = useState("Thành Phố Hà Nội");
  const [postalCode, setPostalCode] = useState("100000");

  // Shipping Method: 'standard' (50.000đ) | 'express' (100.000đ)
  const [shippingMethod, setShippingMethod] = useState<"standard" | "express">("standard");

  // Payment Method: 'cod' | 'banking' | 'card'
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "banking" | "card">("cod");

  // Discount Code
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);
  const [discountError, setDiscountError] = useState("");

  // Cart Dataset
  const CART_ITEMS = [
    {
      id: "prod-1",
      name: "ASUS VivoBook Pro 15",
      price: 5000000,
      quantity: 1,
      image: "/figma/product_1.png",
    },
    {
      id: "prod-2",
      name: "Carbon Shadow Pro",
      price: 5000000,
      quantity: 1,
      image: "/figma/product_2.png",
    },
  ];

  const subtotal = CART_ITEMS.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingFee = shippingMethod === "express" ? 100000 : 50000;
  const discountAmount = (subtotal * appliedDiscount) / 100;
  const total = subtotal + shippingFee - discountAmount;

  const handleApplyDiscount = (e: React.FormEvent) => {
    e.preventDefault();
    setDiscountError("");
    if (discountCode.trim().toUpperCase() === "SHOPWISE10" || discountCode.trim().toUpperCase() === "SALE10") {
      setAppliedDiscount(10);
    } else if (discountCode.trim()) {
      setDiscountError("Mã giảm giá không hợp lệ.");
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("vi-VN").format(val) + "đ";
  };

  return (
    <PublicLayout fullWidth>
      <div className="w-full bg-[#F2F2F2] dark:bg-zinc-950 text-black dark:text-white transition-colors duration-300 min-h-[calc(100vh-60px)]">
        
        {/* If Order Success */}
        {currentStep === "success" ? (
          <div className="w-full max-w-[800px] mx-auto py-16 px-4 text-center space-y-6">
            <CheckCircle2 className="w-20 h-20 text-[#1CCA00] mx-auto animate-bounce" />
            <h1 className="text-[36px] sm:text-[48px] font-bold">Đặt Hàng Thành Công!</h1>
            <p className="text-[18px] text-zinc-600 dark:text-zinc-400">
              Cảm ơn bạn đã mua sắm tại <span className="font-bold text-black dark:text-white">ShopWise</span>. Mã đơn hàng của bạn là <span className="font-mono font-bold text-black dark:text-white">#SW-982103</span>.
            </p>

            <div className="p-8 bg-white dark:bg-zinc-900 border border-black dark:border-zinc-700 text-left space-y-4">
              <h3 className="text-xl font-bold border-b pb-2 border-black/10">Thông tin giao hàng</h3>
              <p className="text-sm"><strong>Người nhận:</strong> {firstName} {lastName}</p>
              <p className="text-sm"><strong>Địa chỉ:</strong> {address}, {city}</p>
              <p className="text-sm"><strong>Phương thức thanh toán:</strong> {paymentMethod === 'cod' ? 'Thanh toán khi nhận hàng (COD)' : paymentMethod === 'banking' ? 'Chuyển khoản Ngân hàng' : 'Thẻ tín dụng'}</p>
              <p className="text-sm font-bold text-lg pt-2 border-t border-black/10">Tổng tiền: {formatCurrency(total)}</p>
            </div>

            <div className="pt-4">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 px-8 py-4 bg-black text-white dark:bg-white dark:text-black font-bold text-[18px] hover:bg-[#C5FA1F] hover:text-black transition-colors"
              >
                Tiếp tục mua sắm
              </Link>
            </div>
          </div>
        ) : (
          <div className="w-[1920px] max-w-full mx-auto grid grid-cols-1 lg:grid-cols-12 min-h-[calc(100vh-60px)]">
            
            {/* LEFT COLUMN: CHECKOUT STEPS & FORM */}
            <div className="lg:col-span-7 p-8 lg:p-16 bg-white dark:bg-zinc-900 border-b lg:border-b-0 lg:border-r border-black dark:border-zinc-800 space-y-8">
              
              {/* Breadcrumbs Indicator */}
              <nav className="flex items-center gap-2 text-sm font-bold tracking-wider uppercase text-zinc-400">
                <Link href="/shop" className="hover:text-black dark:hover:text-white transition-colors">
                  Giỏ hàng
                </Link>
                <ChevronRight className="w-4 h-4" />
                <span className={currentStep === "info" ? "text-black dark:text-white underline" : ""}>
                  Thông tin
                </span>
                <ChevronRight className="w-4 h-4" />
                <span className={currentStep === "shipping" ? "text-black dark:text-white underline" : ""}>
                  Vận chuyển
                </span>
                <ChevronRight className="w-4 h-4" />
                <span className={currentStep === "payment" ? "text-black dark:text-white underline" : ""}>
                  Thanh toán
                </span>
              </nav>

              {/* Summary Banner if Step 2 or Step 3 */}
              {currentStep !== "info" && (
                <div className="p-4 bg-[#F9F9F9] dark:bg-zinc-800 border border-black dark:border-zinc-700 space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-zinc-500 font-medium w-20">Liên hệ:</span>
                      <span className="font-bold">{emailOrPhone}</span>
                    </div>
                    <button
                      onClick={() => setCurrentStep("info")}
                      className="text-xs font-bold underline text-blue-600 hover:text-blue-800 cursor-pointer"
                    >
                      Thay đổi
                    </button>
                  </div>
                  <div className="flex items-center justify-between border-t border-black/10 pt-2">
                    <div className="flex items-center gap-4">
                      <span className="text-zinc-500 font-medium w-20">Giao đến:</span>
                      <span className="font-bold">{address}, {city}</span>
                    </div>
                    <button
                      onClick={() => setCurrentStep("info")}
                      className="text-xs font-bold underline text-blue-600 hover:text-blue-800 cursor-pointer"
                    >
                      Thay đổi
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 1: INFORMATION FORM */}
              {currentStep === "info" && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setCurrentStep("shipping");
                  }}
                  className="space-y-8"
                >
                  {/* Section: Contact Info */}
                  <div className="space-y-4">
                    <h2 className="text-[24px] font-bold">Thông tin liên hệ</h2>
                    <div className="space-y-2">
                      <label className="block text-sm font-bold uppercase">Email hoặc số điện thoại</label>
                      <input
                        type="text"
                        value={emailOrPhone}
                        onChange={(e) => setEmailOrPhone(e.target.value)}
                        required
                        className="w-full h-[54px] px-4 border border-black dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[18px] focus:outline-none focus:ring-2 focus:ring-black"
                      />
                    </div>
                  </div>

                  {/* Section: Shipping Address */}
                  <div className="space-y-4 pt-4 border-t border-black/10 dark:border-white/10">
                    <h2 className="text-[24px] font-bold">Địa chỉ giao hàng</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-bold uppercase">Họ</label>
                        <input
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          required
                          className="w-full h-[54px] px-4 border border-black dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[18px] focus:outline-none focus:ring-2 focus:ring-black"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-bold uppercase">Tên</label>
                        <input
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          required
                          className="w-full h-[54px] px-4 border border-black dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[18px] focus:outline-none focus:ring-2 focus:ring-black"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-bold uppercase">Địa chỉ (Số nhà, tên đường)</label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        required
                        className="w-full h-[54px] px-4 border border-black dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[18px] focus:outline-none focus:ring-2 focus:ring-black"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-bold uppercase">Thành phố / Tỉnh</label>
                        <input
                          type="text"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          required
                          className="w-full h-[54px] px-4 border border-black dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[18px] focus:outline-none focus:ring-2 focus:ring-black"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-bold uppercase">Mã bưu điện</label>
                        <input
                          type="text"
                          value={postalCode}
                          onChange={(e) => setPostalCode(e.target.value)}
                          required
                          className="w-full h-[54px] px-4 border border-black dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[18px] focus:outline-none focus:ring-2 focus:ring-black"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
                    <Link
                      href="/shop"
                      className="inline-flex items-center gap-2 text-sm font-bold text-zinc-600 hover:text-black dark:hover:text-white transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" /> Quay lại Giỏ hàng
                    </Link>

                    <button
                      type="submit"
                      className="w-full sm:w-auto px-8 h-[54px] bg-black text-white dark:bg-white dark:text-black font-bold text-[18px] hover:bg-[#C5FA1F] hover:text-black transition-colors cursor-pointer"
                    >
                      Tiếp tục đến Vận chuyển
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 2: SHIPPING SELECTION */}
              {currentStep === "shipping" && (
                <div className="space-y-8">
                  <h2 className="text-[24px] font-bold">Phương thức vận chuyển</h2>

                  <div className="space-y-4">
                    <label
                      onClick={() => setShippingMethod("standard")}
                      className={`p-6 border border-black dark:border-zinc-700 flex items-center justify-between cursor-pointer transition-colors ${
                        shippingMethod === "standard" ? "bg-[#C5FA1F]/10 border-black" : "bg-white dark:bg-zinc-800"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <input
                          type="radio"
                          name="shipping"
                          checked={shippingMethod === "standard"}
                          onChange={() => setShippingMethod("standard")}
                          className="w-5 h-5 accent-black"
                        />
                        <div>
                          <p className="font-bold text-[18px]">Giao hàng tiêu chuẩn (Bưu điện)</p>
                          <p className="text-xs text-zinc-500 font-medium">2-3 ngày làm việc</p>
                        </div>
                      </div>
                      <span className="font-bold text-[18px]">50.000đ</span>
                    </label>

                    <label
                      onClick={() => setShippingMethod("express")}
                      className={`p-6 border border-black dark:border-zinc-700 flex items-center justify-between cursor-pointer transition-colors ${
                        shippingMethod === "express" ? "bg-[#C5FA1F]/10 border-black" : "bg-white dark:bg-zinc-800"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <input
                          type="radio"
                          name="shipping"
                          checked={shippingMethod === "express"}
                          onChange={() => setShippingMethod("express")}
                          className="w-5 h-5 accent-black"
                        />
                        <div>
                          <p className="font-bold text-[18px]">Giao hàng Hỏa tốc (Express)</p>
                          <p className="text-xs text-zinc-500 font-medium">Nhận hàng trong ngày</p>
                        </div>
                      </div>
                      <span className="font-bold text-[18px]">100.000đ</span>
                    </label>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
                    <button
                      onClick={() => setCurrentStep("info")}
                      className="inline-flex items-center gap-2 text-sm font-bold text-zinc-600 hover:text-black dark:hover:text-white transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" /> Quay lại Thông tin
                    </button>

                    <button
                      onClick={() => setCurrentStep("payment")}
                      className="w-full sm:w-auto px-8 h-[54px] bg-black text-white dark:bg-white dark:text-black font-bold text-[18px] hover:bg-[#C5FA1F] hover:text-black transition-colors cursor-pointer"
                    >
                      Tiếp tục đến Thanh toán
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: PAYMENT SELECTION */}
              {currentStep === "payment" && (
                <div className="space-y-8">
                  <h2 className="text-[24px] font-bold">Phương thức thanh toán</h2>

                  <div className="space-y-4">
                    <label
                      onClick={() => setPaymentMethod("cod")}
                      className={`p-6 border border-black dark:border-zinc-700 flex items-center justify-between cursor-pointer transition-colors ${
                        paymentMethod === "cod" ? "bg-[#C5FA1F]/10 border-black" : "bg-white dark:bg-zinc-800"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <input
                          type="radio"
                          name="payment"
                          checked={paymentMethod === "cod"}
                          onChange={() => setPaymentMethod("cod")}
                          className="w-5 h-5 accent-black"
                        />
                        <span className="font-bold text-[18px]">Thanh toán khi nhận hàng (COD)</span>
                      </div>
                      <Truck className="w-6 h-6" />
                    </label>

                    <label
                      onClick={() => setPaymentMethod("banking")}
                      className={`p-6 border border-black dark:border-zinc-700 flex items-center justify-between cursor-pointer transition-colors ${
                        paymentMethod === "banking" ? "bg-[#C5FA1F]/10 border-black" : "bg-white dark:bg-zinc-800"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <input
                          type="radio"
                          name="payment"
                          checked={paymentMethod === "banking"}
                          onChange={() => setPaymentMethod("banking")}
                          className="w-5 h-5 accent-black"
                        />
                        <span className="font-bold text-[18px]">Chuyển khoản Ngân hàng / QR Code</span>
                      </div>
                      <Tag className="w-6 h-6" />
                    </label>

                    <label
                      onClick={() => setPaymentMethod("card")}
                      className={`p-6 border border-black dark:border-zinc-700 flex items-center justify-between cursor-pointer transition-colors ${
                        paymentMethod === "card" ? "bg-[#C5FA1F]/10 border-black" : "bg-white dark:bg-zinc-800"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <input
                          type="radio"
                          name="payment"
                          checked={paymentMethod === "card"}
                          onChange={() => setPaymentMethod("card")}
                          className="w-5 h-5 accent-black"
                        />
                        <span className="font-bold text-[18px]">Thẻ tín dụng / Ghi nợ (Visa, Mastercard)</span>
                      </div>
                      <CreditCard className="w-6 h-6" />
                    </label>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
                    <button
                      onClick={() => setCurrentStep("shipping")}
                      className="inline-flex items-center gap-2 text-sm font-bold text-zinc-600 hover:text-black dark:hover:text-white transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" /> Quay lại Vận chuyển
                    </button>

                    <button
                      onClick={() => setCurrentStep("success")}
                      className="w-full sm:w-auto px-10 h-[58px] bg-black text-white dark:bg-white dark:text-black font-bold text-[20px] hover:bg-[#1CCA00] hover:text-white transition-all cursor-pointer shadow-lg"
                    >
                      Hoàn tất đặt hàng
                    </button>
                  </div>
                </div>
              )}

            </div>

            {/* RIGHT COLUMN: ORDER SUMMARY SIDEBAR */}
            <div className="lg:col-span-5 p-8 lg:p-16 bg-[#F9F9F9] dark:bg-zinc-950 space-y-8">
              <h2 className="text-[24px] font-bold">Đơn hàng của bạn ({CART_ITEMS.length})</h2>

              {/* Cart Items List */}
              <div className="space-y-4 divide-y divide-black/10 dark:divide-white/10">
                {CART_ITEMS.map((item) => (
                  <div key={item.id} className="pt-4 first:pt-0 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="relative w-16 h-16 border border-black dark:border-zinc-700 bg-white p-2 shrink-0">
                        <Image src={item.image} alt={item.name} fill className="object-contain p-1" />
                        <span className="absolute -top-2 -right-2 w-6 h-6 bg-black text-white text-xs font-bold rounded-full flex items-center justify-center">
                          {item.quantity}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-bold text-[18px]">{item.name}</h4>
                        <p className="text-xs text-zinc-500">Mã SP: {item.id}</p>
                      </div>
                    </div>
                    <span className="font-extrabold text-[18px]">{formatCurrency(item.price)}</span>
                  </div>
                ))}
              </div>

              {/* Discount Code Form */}
              <form onSubmit={handleApplyDiscount} className="pt-6 border-t border-black/10 dark:border-white/10 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value)}
                    placeholder="Mã giảm giá (ví dụ: SHOPWISE10)"
                    className="flex-1 h-[50px] px-4 border border-black dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[16px] focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-6 h-[50px] bg-black text-white dark:bg-white dark:text-black font-bold text-sm hover:bg-[#C5FA1F] hover:text-black transition-colors cursor-pointer"
                  >
                    Áp dụng
                  </button>
                </div>
                {appliedDiscount > 0 && (
                  <p className="text-[#1CCA00] text-xs font-bold flex items-center gap-1">
                    <Check className="w-4 h-4" /> Đã áp dụng giảm giá {appliedDiscount}%!
                  </p>
                )}
                {discountError && <p className="text-red-600 text-xs font-bold">{discountError}</p>}
              </form>

              {/* Total Calculation Breakdown */}
              <div className="pt-6 border-t border-black/10 dark:border-white/10 space-y-3 text-[16px]">
                <div className="flex justify-between">
                  <span className="text-zinc-500 font-medium">Tổng phụ</span>
                  <span className="font-bold">{formatCurrency(subtotal)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-zinc-500 font-medium">Phí vận chuyển</span>
                  <span className="font-bold">{formatCurrency(shippingFee)}</span>
                </div>

                {appliedDiscount > 0 && (
                  <div className="flex justify-between text-green-600 font-bold">
                    <span>Giảm giá ({appliedDiscount}%)</span>
                    <span>-{formatCurrency(discountAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-xs text-zinc-400">
                  <span>Thuế VAT (8%)</span>
                  <span>Đã bao gồm trong giá</span>
                </div>

                <div className="flex justify-between items-baseline pt-4 border-t border-black dark:border-white text-[24px] font-extrabold">
                  <span>Tổng cộng</span>
                  <span className="text-[28px] text-black dark:text-white">{formatCurrency(total)}</span>
                </div>
              </div>

            </div>

          </div>
        )}

      </div>
    </PublicLayout>
  );
}
