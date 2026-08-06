"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cartService } from "@/services/cartService";
import { profileService } from "@/services/profileService";
import { voucherService } from "@/services/voucherService";
import { orderService } from "@/services/orderService";
import { paymentService } from "@/services/paymentService";
import { useRouter } from "next/navigation";
import PublicLayout from "@/shared/layouts/PublicLayout";
import { checkoutSchema, type CheckoutFormValues } from "@/schemas/checkoutSchema";
import { notifyError } from "@/components/Notify";
import AddressForm from "@/shared/components/AddressForm";
import StripeCheckoutForm from "@/shared/components/StripeCheckoutForm";
import type { AddressFormValues } from "@/schemas/addressSchema";

type Any = Record<string, any>;
const unwrap = (x: any) => x?.data ?? x;

const PAYMENT_METHODS: { value: CheckoutFormValues["paymentMethod"]; label: string }[] = [
  { value: "COD", label: "Thanh toán khi nhận hàng (COD)" },
  { value: "VNPAY", label: "VNPay" },
  { value: "STRIPE", label: "Thẻ quốc tế (Stripe)" },
];

export default function CheckoutPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  // Chặn double-submit (không dựa vào isPending, vì onClick có thể bắn 2 lần
  // trong cùng 1 tick trước khi state re-render kịp).
  const submittingRef = useRef(false);

  // Địa chỉ vừa tạo trong Checkout mà user KHÔNG tick "lưu cho lần sau" -> xoá sau khi đặt hàng xong
  const [temporaryAddressId, setTemporaryAddressId] = useState<string | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);

  // Stripe: sau khi order tạo xong + init payment xong, hiện form nhập thẻ (PaymentElement)
  // thay vì redirect ngay như COD/VNPay.
  const [stripeSession, setStripeSession] = useState<{ clientSecret: string; orderId: string } | null>(null);

  const {
    watch,
    setValue,
    handleSubmit,
    formState: { errors, isValid },
    register,
    trigger,
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    mode: "onChange",
    defaultValues: { addressId: "", paymentMethod: "COD", voucherCode: "" },
  });

  const addressId = watch("addressId");
  const paymentMethod = watch("paymentMethod");
  const voucherCode = watch("voucherCode") || "";

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

  // Tự chọn địa chỉ mặc định khi danh sách tải xong, nếu user chưa chọn tay.
  useEffect(() => {
    if (!addressId && addressRows.length > 0) {
      const def = addressRows.find((a) => a.isDefault) || addressRows[0];
      setValue("addressId", def.id, { shouldValidate: true });
    }
  }, [addressRows, addressId, setValue]);

  const createAddress = useMutation({
    mutationFn: (data: AddressFormValues) => profileService.createAddress(data),
    onError: (error: any) => {
      notifyError(error?.response?.data?.message || error?.message || "Không thể lưu địa chỉ.");
    },
  });

  const handleSaveNewAddress = (address: AddressFormValues & { id?: string }, saveToBook: boolean) => {
    // BE (OrderCreateRequest) chỉ nhận addressId, không có field địa chỉ rời rạc -> luôn phải
    // POST /addresses để có id trước, dù có tick "lưu cho lần sau" hay không.
    createAddress.mutate(address, {
      onSuccess: (res: any) => {
        const created = unwrap(res);
        queryClient.invalidateQueries({ queryKey: ["addresses"] });
        setValue("addressId", created.id, { shouldValidate: true });
        setTemporaryAddressId(saveToBook ? null : created.id);
        setShowAddressForm(false);
      },
    });
  };

  const validate = useMutation({
    mutationFn: async () => {
      const ok = await trigger("voucherCode");
      if (!ok || !voucherCode.trim()) throw new Error("Mã giảm giá không hợp lệ");
      return voucherService.validate({ code: voucherCode.trim(), eligibleAmount });
    },
    onError: (error: any) => {
      notifyError(error?.response?.data?.message || error?.message || "Không áp dụng được mã giảm giá.");
    },
  });

  const discount: number = Number(unwrap(validate.data)?.discountAmount ?? 0);

  // Dọn địa chỉ tạm (không lưu cho lần sau) sau khi order đã tạo thành công.
  const cleanupTemporaryAddress = () => {
    if (temporaryAddressId) {
      profileService.deleteAddress(temporaryAddressId).catch(() => {
        // Chỉ log, không ảnh hưởng luồng đặt hàng - đơn đã tạo thành công là quan trọng nhất.
        console.error("Không thể xoá địa chỉ tạm", temporaryAddressId);
      });
      setTemporaryAddressId(null);
    }
  };

  const place = useMutation({
    mutationFn: (values: CheckoutFormValues) =>
      orderService.create({
        addressId: values.addressId,
        paymentMethod: values.paymentMethod,
        voucherCode: values.voucherCode?.trim() || undefined,
      }),
    onSuccess: async (data: any) => {
      const order = unwrap(data) || {};
      const orderId = order.id || order.orderId;
      cleanupTemporaryAddress();

      if (paymentMethod === "COD") {
        router.push(`/payment?status=success&orderId=${orderId}`);
        return;
      }

      const payment: any = unwrap(await paymentService.init(String(orderId)));

      if (paymentMethod === "STRIPE" && payment.clientSecret) {
        setStripeSession({ clientSecret: payment.clientSecret, orderId: String(orderId) });
        return;
      }
      if (payment.paymentUrl) {
        window.location.assign(payment.paymentUrl);
        return;
      }
      router.push(`/payment?status=success&orderId=${orderId}`);
    },
    onSettled: () => {
      submittingRef.current = false;
    },
    onError: (error: any) => {
      notifyError(error?.response?.data?.message || "Không thể tạo đơn hàng. Vui lòng kiểm tra lại thông tin.");
    },
  });

  const onSubmit = (values: CheckoutFormValues) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    place.mutate(values);
  };

  const canSubmit = isValid && items.length > 0 && addressRows.length > 0 && !place.isPending;

  return (
    <PublicLayout fullWidth>
      <section className="min-h-screen bg-white">
        <header className="border-b border-black px-6 py-8 lg:px-12">
          <h1 className="text-4xl font-medium">Thanh toán</h1>
        </header>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-0 lg:grid-cols-[1fr_420px]">
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
                      addressId === address.id ? "border-black bg-zinc-50" : "border-zinc-300"
                    }`}
                  >
                    <input
                      className="mr-3"
                      type="radio"
                      name="addressId"
                      checked={addressId === address.id}
                      onChange={() => setValue("addressId", address.id, { shouldValidate: true })}
                    />
                    <strong>{address.recipientName}</strong>
                    <p className="mt-1 text-sm">
                      {[address.phone, address.detailAddress, address.ward, address.district, address.province].filter(Boolean).join(", ")}
                    </p>
                  </label>
                ))
              )}
              {!addressRows.length && !addresses.isLoading && (
                <p className="text-sm text-zinc-500">Bạn chưa có địa chỉ nào. Thêm địa chỉ mới để tiếp tục.</p>
              )}
              <button
                type="button"
                onClick={() => setShowAddressForm(true)}
                className="w-full border border-dashed border-black px-4 py-3 text-sm font-medium hover:bg-zinc-50"
              >
                + Thêm địa chỉ mới
              </button>
              {errors.addressId && <p className="text-sm text-red-600">{errors.addressId.message}</p>}
            </div>

            <h2 className="mt-8 text-xl font-medium">Phương thức thanh toán</h2>
            <div className="mt-4 grid gap-2">
              {PAYMENT_METHODS.map((method) => (
                <label className="border border-black p-4" key={method.value}>
                  <input
                    className="mr-3"
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === method.value}
                    onChange={() => setValue("paymentMethod", method.value, { shouldValidate: true })}
                  />
                  {method.label}
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
                maxLength={50}
                {...register("voucherCode")}
              />
              <button
                type="button"
                disabled={!voucherCode.trim() || !!errors.voucherCode || validate.isPending}
                onClick={() => validate.mutate()}
                className="border border-l-0 border-black px-3 text-sm disabled:opacity-40"
              >
                Áp dụng
              </button>
            </div>
            {errors.voucherCode && <p className="mt-1 text-xs text-red-600">{errors.voucherCode.message}</p>}

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
              type="submit"
              disabled={!canSubmit}
              className="mt-6 w-full bg-black py-4 text-sm font-medium text-white disabled:opacity-40"
            >
              {place.isPending ? "Đang tạo đơn…" : "Đặt hàng"}
            </button>
          </aside>
        </form>
      </section>

      {showAddressForm && (
        <AddressForm
          initial={{}}
          saving={createAddress.isPending}
          showSaveToBookOption
          onClose={() => setShowAddressForm(false)}
          onSave={handleSaveNewAddress}
        />
      )}

      {stripeSession && (
        <StripeCheckoutForm
          clientSecret={stripeSession.clientSecret}
          orderId={stripeSession.orderId}
          onCancel={() => setStripeSession(null)}
        />
      )}
    </PublicLayout>
  );
}
