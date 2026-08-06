"use client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { cartService } from "@/services/cartService";
import { profileService } from "@/services/profileService";
import { voucherService } from "@/services/voucherService";
import { orderService } from "@/services/orderService";
import { paymentService } from "@/services/paymentService";
import { useRouter } from "next/navigation";
import PublicLayout from "@/shared/layouts/PublicLayout";

type Any = Record<string, any>;
const unwrap = (x: any) => x?.data ?? x;

export default function CheckoutPage() {
  const router = useRouter();
  const [addressId, setAddressId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState(0);

  const cart = useQuery({ queryKey: ["cart"], queryFn: () => cartService.getCart() });
  const addresses = useQuery({ queryKey: ["addresses"], queryFn: () => profileService.addresses() });

  // CartItemResponse thật: price, salePrice (null nếu không sale), subtotal đã tính sẵn từ BE.
  const items: Any[] = unwrap(cart.data)?.items || [];
  const subtotal: number = unwrap(cart.data)?.subtotal ?? 0;

  // Voucher không áp lên hàng đang sale (VoucherServiceImpl) -> eligibleAmount chỉ tính subtotal
  // của các item có salePrice == null, không phải toàn bộ subtotal giỏ hàng.
  const eligibleAmount = useMemo(
    () => items.filter((item) => item.salePrice == null).reduce((sum, item) => sum + Number(item.subtotal || 0), 0),
    [items]
  );

  // AddressResponse thật: recipientName, phone, province, district, ward, detailAddress, isDefault.
  const addressRows: Any[] = unwrap(addresses.data) || [];

  const validate = useMutation({
    mutationFn: () => voucherService.validate({ code, eligibleAmount }),
    onSuccess: (data: any) => {
      const d = unwrap(data) || {};
      setDiscount(Number(d.discountAmount ?? 0));
    },
  });

  const place = useMutation({
    mutationFn: () =>
      orderService.create({
        addressId: addressId || addressRows.find((a) => a.isDefault)?.id,
        paymentMethod,
        voucherCode: code || undefined,
      }),
    onSuccess: async (data: any) => {
      const order = unwrap(data) || {};
      const orderId = order.id || order.orderId;
      if (paymentMethod === "COD") {
        router.push(`/payment?status=success&orderId=${orderId}`);
        return;
      }
      const payment: any = unwrap(await paymentService.init(String(orderId), { paymentMethod }));
      if (payment.paymentUrl) window.location.assign(payment.paymentUrl);
      else router.push(`/payment?status=success&orderId=${orderId}`);
    },
  });

  return (
    <PublicLayout fullWidth>
      <section className="min-h-screen bg-white">
        <header className="border-b border-black px-6 py-8 lg:px-12">
          <h1 className="text-4xl font-medium">Thanh toán</h1>
        </header>
        <div className="grid gap-0 lg:grid-cols-[1fr_420px]">
          <main className="p-6 lg:p-10">
            <h2 className="text-xl font-medium">Thông tin giao hàng</h2>
            <div className="mt-4 space-y-3">
              {addresses.isLoading ? (
                <p>Đang tải địa chỉ…</p>
              ) : (
                addressRows.map((address) => (
                  <label
                    key={address.id}
                    className={`block cursor-pointer border p-4 ${
                      addressId === address.id || (!addressId && address.isDefault) ? "border-black bg-zinc-50" : "border-zinc-300"
                    }`}
                  >
                    <input
                      className="mr-3"
                      type="radio"
                      name="address"
                      checked={addressId === address.id || (!addressId && address.isDefault)}
                      onChange={() => setAddressId(address.id)}
                    />
                    <strong>{address.recipientName}</strong>
                    <p className="mt-1 text-sm">
                      {[address.phone, address.detailAddress, address.ward, address.district, address.province].filter(Boolean).join(", ")}
                    </p>
                  </label>
                ))
              )}
              {!addressRows.length && !addresses.isLoading && (
                <p className="text-sm text-zinc-500">Chưa có địa chỉ. Vui lòng thêm địa chỉ trong Tài khoản.</p>
              )}
            </div>

            <h2 className="mt-8 text-xl font-medium">Phương thức thanh toán</h2>
            <div className="mt-4 grid gap-2">
              {["COD", "VNPAY", "STRIPE"].map((method) => (
                <label className="border border-black p-4" key={method}>
                  <input className="mr-3" type="radio" checked={paymentMethod === method} onChange={() => setPaymentMethod(method)} />
                  {method}
                </label>
              ))}
            </div>
          </main>

          <aside className="border-l border-black p-6 lg:p-10">
            <h2 className="text-xl font-medium">Tóm tắt đơn hàng</h2>
            <div className="mt-5 space-y-3 border-b border-black pb-5">
              {cart.isLoading ? (
                <p>Đang tải giỏ hàng…</p>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="flex justify-between gap-4 text-sm">
                    <span>
                      {item.productName} × {item.quantity}
                    </span>
                    <strong>{Number(item.subtotal || 0).toLocaleString("vi-VN")} ₫</strong>
                  </div>
                ))
              )}
            </div>

            <div className="mt-5 flex">
              <input
                className="min-w-0 flex-1 border border-black px-3 py-2"
                placeholder="Mã giảm giá"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
              <button disabled={!code || validate.isPending} onClick={() => validate.mutate()} className="border border-l-0 border-black px-3 text-sm">
                Áp dụng
              </button>
            </div>

            <dl className="mt-5 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt>Tạm tính</dt>
                <dd>{subtotal.toLocaleString("vi-VN")} ₫</dd>
              </div>
              <div className="flex justify-between">
                <dt>Giảm giá</dt>
                <dd>-{discount.toLocaleString("vi-VN")} ₫</dd>
              </div>
              <div className="flex justify-between border-t border-black pt-3 text-lg font-medium">
                <dt>Tổng</dt>
                <dd>{Math.max(0, subtotal - discount).toLocaleString("vi-VN")} ₫</dd>
              </div>
            </dl>

            <button
              disabled={place.isPending || !items.length || !addressRows.length}
              onClick={() => place.mutate()}
              className="mt-6 w-full bg-black py-4 text-sm font-medium text-white disabled:opacity-40"
            >
              {place.isPending ? "Đang tạo đơn…" : "Đặt hàng"}
            </button>
            {place.isError && <p className="mt-3 text-sm text-red-600">Không thể tạo đơn hàng. Vui lòng kiểm tra lại thông tin.</p>}
          </aside>
        </div>
      </section>
    </PublicLayout>
  );
}
