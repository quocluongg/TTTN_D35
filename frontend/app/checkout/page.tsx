"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { cartService } from "@/services/cartService";
import { profileService } from "@/services/profileService";
import { voucherService } from "@/services/voucherService";
import { orderService } from "@/services/orderService";
import { paymentService } from "@/services/paymentService";
import { useRouter } from "next/navigation";
import PublicLayout from "@/shared/layouts/PublicLayout";
import AddressForm from "@/components/AddressForm";
import StripeCheckoutForm from "@/components/StripeCheckoutForm";
import { getStripe } from "@/lib/stripe";
import { Elements } from "@stripe/react-stripe-js";
import { notifySuccess, notifyError } from "@/components/Notify";
import { Plus } from "lucide-react";

type Any = Record<string, any>;
const unwrap = (x: any) => x?.data ?? x;

export default function CheckoutPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [addressId, setAddressId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [showAddAddressModal, setShowAddAddressModal] = useState(false);

  // Stripe state
  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(null);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);

  // Queries
  const cartQuery = useQuery({
    queryKey: ["cart"],
    queryFn: () => cartService.getCart(),
  });
  const addressesQuery = useQuery({
    queryKey: ["addresses"],
    queryFn: () => profileService.addresses(),
  });

  const cartData: Any = unwrap(cartQuery.data) || {};
  const items: Any[] = cartData.items || cartData.cartItems || [];
  const addressRows: Any[] = unwrap(addressesQuery.data) || [];

  // Subtotal calculation
  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, item) =>
          sum +
          Number(item.quantity || 0) *
            Number(item.subtotal ? item.subtotal / (item.quantity || 1) : item.salePrice ?? item.price ?? item.unitPrice ?? 0),
        0
      ),
    [items]
  );

  const eligibleAmountForVoucher = useMemo(
    () =>
      items
        .filter((item) => !item.salePrice)
        .reduce(
          (sum, item) =>
            sum + Number(item.quantity || 0) * Number(item.price ?? item.unitPrice ?? 0),
          0
        ),
    [items]
  );

  // Voucher validation mutation
  const validateVoucherMutation = useMutation({
    mutationFn: () =>
      voucherService.validate({ code, eligibleAmount: eligibleAmountForVoucher }),
    onSuccess: (data: any) => {
      const d = unwrap(data) || {};
      const discountVal = Number(d.discountAmount ?? d.discount ?? 0);
      setDiscount(discountVal);
      notifySuccess(`Áp dụng mã giảm giá thành công: -${discountVal.toLocaleString("vi-VN")} ₫`);
    },
    onError: (err: any) => {
      notifyError(err?.response?.data?.message || err?.message || "Mã giảm giá không hợp lệ.");
      setDiscount(0);
    },
  });

  // Create address mutation directly in checkout
  const createAddressMutation = useMutation({
    mutationFn: (data: Any) => profileService.createAddress(data),
    onSuccess: (res: any) => {
      const created = unwrap(res) || {};
      notifySuccess("Đã thêm địa chỉ giao hàng mới!");
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      if (created.id) {
        setAddressId(created.id);
      }
      setShowAddAddressModal(false);
    },
    onError: (err: any) => {
      notifyError(err?.response?.data?.message || err?.message || "Không thể tạo địa chỉ mới!");
    },
  });

  // Place order mutation
  const placeOrderMutation = useMutation({
    mutationFn: () => {
      const selectedAddressId = addressId || addressRows.find((a) => a.isDefault)?.id || addressRows[0]?.id;
      if (!selectedAddressId) {
        throw new Error("Vui lòng chọn hoặc thêm địa chỉ giao hàng!");
      }
      return orderService.create({
        addressId: selectedAddressId,
        paymentMethod,
        voucherCode: code || undefined,
      });
    },
    onSuccess: async (data: any) => {
      const order = unwrap(data) || {};
      const orderId = order.id || order.orderId;
      queryClient.invalidateQueries({ queryKey: ["cart"] });

      if (paymentMethod === "COD") {
        router.push(`/payment?status=success&orderId=${orderId}`);
        return;
      }

      // Khởi tạo thanh toán (Stripe / VNPay)
      const paymentRes: any = unwrap(await paymentService.init(String(orderId), { paymentMethod }));

      if (paymentMethod === "STRIPE") {
        if (paymentRes.clientSecret) {
          setStripeClientSecret(paymentRes.clientSecret);
          setCreatedOrderId(String(orderId));
          notifySuccess("Đã khởi tạo đơn hàng! Vui lòng nhập thông tin thẻ bên dưới để hoàn tất.");
          setTimeout(() => {
            window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
          }, 300);
        } else {
          notifyError("Không thể khởi tạo cổng thanh toán Stripe. Vui lòng thử lại!");
        }
      } else if (paymentMethod === "VNPAY") {
        if (paymentRes.paymentUrl) {
          window.location.assign(paymentRes.paymentUrl);
        } else {
          router.push(`/payment?status=success&orderId=${orderId}`);
        }
      }
    },
    onError: (err: any) => {
      notifyError(err?.response?.data?.message || err?.message || "Không thể tạo đơn hàng. Vui lòng thử lại!");
    },
  });

  const selectedAddress = addressId
    ? addressRows.find((a) => a.id === addressId)
    : addressRows.find((a) => a.isDefault) || addressRows[0];

  const stripePromise = useMemo(() => getStripe(), []);

  return (
    <PublicLayout fullWidth>
      <section className="min-h-screen bg-white">
        <header className="border-b border-black px-6 py-8 lg:px-12">
          <h1 className="text-4xl font-medium">Thanh toán đơn hàng</h1>
        </header>

        <div className="grid gap-0 lg:grid-cols-[1fr_420px]">
          <main className="p-6 lg:p-10 space-y-8">
            {/* THÔNG TIN GIAO HÀNG */}
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-medium">1. Thông tin giao hàng</h2>
                <button
                  type="button"
                  onClick={() => setShowAddAddressModal(true)}
                  className="flex items-center gap-1 border border-black px-3 py-1.5 text-xs font-medium hover:bg-zinc-100 cursor-pointer"
                >
                  <Plus size={14} /> Thêm địa chỉ mới
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {addressesQuery.isLoading ? (
                  <p className="text-sm">Đang tải danh sách địa chỉ…</p>
                ) : addressRows.length > 0 ? (
                  addressRows.map((address) => {
                    const isChecked = addressId ? addressId === address.id : selectedAddress?.id === address.id;
                    return (
                      <label
                        key={address.id}
                        className={`block cursor-pointer border p-4 transition-colors ${
                          isChecked ? "border-black bg-zinc-50 font-medium" : "border-zinc-300 hover:border-zinc-400"
                        }`}
                      >
                        <div className="flex items-start">
                          <input
                            className="mt-1 mr-3 h-4 w-4 text-black border-black focus:ring-black"
                            type="radio"
                            name="address"
                            checked={isChecked}
                            onChange={() => setAddressId(address.id)}
                            disabled={!!stripeClientSecret}
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <strong>{address.recipientName || address.receiverName || address.fullName}</strong>
                              {address.isDefault && (
                                <span className="border border-black px-2 py-0.5 text-[10px] uppercase font-bold">Mặc định</span>
                              )}
                            </div>
                            <p className="mt-1 text-sm text-zinc-700">
                              {[
                                address.phone,
                                address.detailAddress || address.addressLine,
                                address.ward,
                                address.district,
                                address.province,
                              ]
                                .filter(Boolean)
                                .join(", ")}
                            </p>
                            {address.note && (
                              <p className="mt-1 text-xs italic text-zinc-500">Ghi chú: {address.note}</p>
                            )}
                          </div>
                        </div>
                      </label>
                    );
                  })
                ) : (
                  <div className="border border-dashed border-zinc-400 p-6 text-center space-y-3">
                    <p className="text-sm text-zinc-600">Bạn chưa có địa chỉ giao hàng nào trong hệ thống.</p>
                    <button
                      type="button"
                      onClick={() => setShowAddAddressModal(true)}
                      className="inline-flex items-center gap-1.5 bg-black px-4 py-2 text-sm text-white font-medium cursor-pointer"
                    >
                      <Plus size={16} /> Thêm địa chỉ mới ngay
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* PHƯƠNG THỨC THANH TOÁN */}
            <div>
              <h2 className="text-xl font-medium">2. Phương thức thanh toán</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {[
                  { id: "COD", name: "Thanh toán khi nhận hàng (COD)" },
                  { id: "VNPAY", name: "Cổng thanh toán VNPay" },
                  { id: "STRIPE", name: "Thẻ quốc tế (Stripe)" },
                ].map((method) => (
                  <label
                    key={method.id}
                    className={`block cursor-pointer border p-4 transition-colors ${
                      paymentMethod === method.id ? "border-black bg-zinc-50 font-medium" : "border-zinc-300"
                    }`}
                  >
                    <input
                      className="mr-2"
                      type="radio"
                      name="payment"
                      checked={paymentMethod === method.id}
                      onChange={() => setPaymentMethod(method.id)}
                      disabled={!!stripeClientSecret}
                    />
                    <span className="text-sm">{method.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* KHU VỰC NHẬP THẺ STRIPE KHI CÓ CLIENT SECRET */}
            {stripeClientSecret && createdOrderId && (
              <div className="pt-6 border-t border-black">
                <Elements
                  stripe={stripePromise}
                  options={{ clientSecret: stripeClientSecret }}
                >
                  <StripeCheckoutForm orderId={createdOrderId} />
                </Elements>
              </div>
            )}
          </main>

          {/* ASIDE: TÓM TẮT ĐƠN HÀNG */}
          <aside className="border-l border-black p-6 lg:p-10 bg-zinc-50 flex flex-col justify-between">
            <div>
              <h2 className="text-xl font-medium">Tóm tắt đơn hàng</h2>
              
              <div className="mt-5 space-y-3 border-b border-black pb-5">
                {cartQuery.isLoading ? (
                  <p className="text-sm">Đang tải giỏ hàng…</p>
                ) : items.length > 0 ? (
                  items.map((item) => {
                    const price = Number(item.salePrice ?? item.price ?? item.unitPrice ?? 0);
                    const itemTotal = Number(item.subtotal ?? price * Number(item.quantity || 1));
                    return (
                      <div key={item.id || item.variantId} className="flex justify-between gap-4 text-sm">
                        <span className="line-clamp-2">
                          {item.productName || item.name} × <strong>{item.quantity}</strong>
                        </span>
                        <strong className="shrink-0">{itemTotal.toLocaleString("vi-VN")} ₫</strong>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-zinc-500">Giỏ hàng trống.</p>
                )}
              </div>

              {/* VOUCHER FORM */}
              <div className="mt-5 flex">
                <input
                  className="min-w-0 flex-1 border border-black px-3 py-2 text-xs uppercase font-mono"
                  placeholder="Mã giảm giá (ví dụ: SHOPWISE10)"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  disabled={!!stripeClientSecret}
                />
                <button
                  disabled={!code || validateVoucherMutation.isPending || !!stripeClientSecret}
                  onClick={() => validateVoucherMutation.mutate()}
                  className="border border-l-0 border-black px-4 text-xs font-medium bg-black text-white disabled:opacity-40"
                >
                  {validateVoucherMutation.isPending ? "Đang check..." : "Áp dụng"}
                </button>
              </div>

              {/* BẢNG TỔNG TIỀN */}
              <dl className="mt-5 space-y-2 text-sm">
                <div className="flex justify-between text-zinc-600">
                  <dt>Tạm tính</dt>
                  <dd className="font-mono">{subtotal.toLocaleString("vi-VN")} ₫</dd>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-700 font-semibold">
                    <dt>Giảm giá voucher</dt>
                    <dd className="font-mono">-{discount.toLocaleString("vi-VN")} ₫</dd>
                  </div>
                )}
                <div className="flex justify-between text-zinc-600">
                  <dt>Phí giao hàng</dt>
                  <dd className="text-green-700 font-bold text-xs uppercase">Miễn phí</dd>
                </div>
                <div className="flex justify-between border-t border-black pt-3 text-lg font-medium">
                  <dt>Tổng cộng</dt>
                  <dd className="font-extrabold">{Math.max(0, subtotal - discount).toLocaleString("vi-VN")} ₫</dd>
                </div>
              </dl>
            </div>

            {/* BUTTON XÁC NHẬN ĐẶT HÀNG / TẠO ĐƠN STRIPE */}
            {!stripeClientSecret && (
              <div className="pt-6 border-t border-black mt-6">
                <button
                  disabled={placeOrderMutation.isPending || !items.length || (!addressId && !selectedAddress)}
                  onClick={() => placeOrderMutation.mutate()}
                  className="w-full bg-black py-4 text-sm font-medium text-white disabled:opacity-40 hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  {placeOrderMutation.isPending ? "Đang tạo đơn hàng…" : "Xác nhận đặt hàng"}
                </button>
              </div>
            )}
          </aside>
        </div>
      </section>

      {/* MODAL THÊM ĐỊA CHỈ MỚI TRỰC TIẾP */}
      {showAddAddressModal && (
        <AddressForm
          onClose={() => setShowAddAddressModal(false)}
          onSave={(data) => createAddressMutation.mutate(data)}
          isPending={createAddressMutation.isPending}
        />
      )}
    </PublicLayout>
  );
}
