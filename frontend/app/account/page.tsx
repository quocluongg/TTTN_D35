"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileService } from "@/services/profileService";
import { orderService } from "@/services/orderService";
import { authService } from "@/services/authServices";
import { useLogout } from "@/hooks/useAuth";
import StatusBadge from "@/components/StatusBadge";
import ConfirmDialog from "@/components/ConfirmDialog";
import AddressForm from "@/components/AddressForm";
import PublicLayout from "@/shared/layouts/PublicLayout";
import { notifySuccess, notifyError } from "@/components/Notify";
import { profileSchema, ProfileFormValues } from "@/schemas/profileSchema";
import { Check, Eye, EyeOff, Loader2 } from "lucide-react";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";

type Any = Record<string, any>;
const unwrap = (x: any) => x?.data ?? x;

export default function AccountPage() {
  return (
    <Suspense fallback={<div className="min-h-screen grid place-items-center bg-white text-black text-sm">Đang tải tài khoản…</div>}>
      <AccountContent />
    </Suspense>
  );
}

function AccountContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [tab, setTab] = useState<"profile" | "addresses" | "orders">("profile");

  useEffect(() => {
    if (tabParam === "orders" || tabParam === "addresses" || tabParam === "profile") {
      setTab(tabParam);
    }
  }, [tabParam]);

  const queryClient = useQueryClient();
  const logout = useLogout();

  // Queries
  const profileQuery = useQuery({
    queryKey: ["profile"],
    queryFn: () => profileService.me(),
  });
  const addressesQuery = useQuery({
    queryKey: ["addresses"],
    queryFn: () => profileService.addresses(),
  });
  const ordersQuery = useQuery({
    queryKey: ["orders"],
    queryFn: () => orderService.list({ page: 0, size: 10 }),
  });

  const user: Any = unwrap(profileQuery.data) || {};

  const addressRows: Any[] = unwrap(addressesQuery.data) || [];
  const orderPayload: any = unwrap(ordersQuery.data) || {};
  const orderRows: Any[] = Array.isArray(orderPayload)
    ? orderPayload
    : orderPayload.content || orderPayload.items || [];

  // State local
  const [editingAddress, setEditingAddress] = useState<Any | null>(null);
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

  // Profile Form with react-hook-form & zod
  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors, isValid: isProfileValid },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    values: {
      fullName: user.fullName || "",
      phoneNumber: user.phoneNumber || "",
      avatarUrl: user.avatarUrl || "",
    },
    mode: "onChange",
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: ProfileFormValues) => profileService.update(data),
    onSuccess: () => {
      notifySuccess("Cập nhật thông tin cá nhân thành công!");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (err: any) => {
      notifyError(err?.message || err?.response?.data?.message || "Cập nhật thất bại!");
    },
  });

  // Address Mutations
  const saveAddressMutation = useMutation({
    mutationFn: (data: Any) =>
      data.id
        ? profileService.updateAddress(data.id, data)
        : profileService.createAddress(data),
    onSuccess: () => {
      notifySuccess("Đã lưu địa chỉ!");
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      setEditingAddress(null);
    },
    onError: (err: any) => {
      notifyError(err?.message || err?.response?.data?.message || "Lỗi lưu địa chỉ!");
    },
  });

  const removeAddressMutation = useMutation({
    mutationFn: (id: string) => profileService.deleteAddress(id),
    onSuccess: () => {
      notifySuccess("Đã xóa địa chỉ thành công!");
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
    },
    onError: (err: any) => {
      notifyError(err?.message || err?.response?.data?.message || "Không thể xóa địa chỉ!");
    },
  });

  // Order Mutations
  const cancelOrderMutation = useMutation({
    mutationFn: (id: string) => orderService.cancel(id),
    onSuccess: () => {
      notifySuccess("Hủy đơn hàng thành công!");
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (err: any) => {
      notifyError(err?.message || err?.response?.data?.message || "Không thể hủy đơn hàng!");
    },
  });

  return (
    <PublicLayout fullWidth>
      <section className="min-h-screen bg-white text-black">
        <div className="border-b border-black px-6 py-10 lg:px-12">
          <h1 className="text-4xl font-medium tracking-tight">Tài khoản của tôi</h1>
        </div>

        <div className="grid lg:grid-cols-[240px_1fr] border-b border-black">
          {/* Sidebar */}
          <aside className="border-r border-black p-4">
            {[
              ["profile", "Thông tin cá nhân"],
              ["addresses", "Sổ địa chỉ"],
              ["orders", "Đơn hàng của tôi"],
            ].map(([id, label]) => (
              <button
                key={id}
                onClick={() => setTab(id as any)}
                className={`block w-full px-4 py-3 text-left text-sm font-medium transition-colors ${tab === id ? "bg-black text-white" : "hover:bg-zinc-100"
                  }`}
              >
                {label}
              </button>
            ))}
            <button
              onClick={logout}
              className="mt-6 w-full border border-black px-4 py-3 text-left text-sm hover:bg-zinc-100 font-medium"
            >
              Đăng xuất
            </button>
          </aside>

          {/* Main Content */}
          <main className="min-h-[600px] p-6 lg:p-10">
            {/* Tab Profile */}
            {tab === "profile" && (
              <div className="max-w-xl">
                <h2 className="text-2xl font-medium">Thông tin cá nhân</h2>
                <form
                  className="mt-6 space-y-4"
                  onSubmit={handleSubmitProfile((data) => updateProfileMutation.mutate(data))}
                >
                  <div>
                    <label className="block text-sm font-medium">Họ và tên *</label>
                    <input
                      {...registerProfile("fullName")}
                      className="mt-1 block w-full border border-black px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
                    />
                    {profileErrors.fullName && (
                      <p className="mt-1 text-xs text-red-600">{profileErrors.fullName.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium">Email (không thể sửa)</label>
                    <input
                      type="email"
                      value={user.email || ""}
                      disabled
                      className="mt-1 block w-full border border-zinc-300 bg-zinc-100 px-3 py-2 text-sm text-zinc-600 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium">Số điện thoại</label>
                    <input
                      {...registerProfile("phoneNumber")}
                      placeholder="Ví dụ: 0912345678"
                      className="mt-1 block w-full border border-black px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
                    />
                    {profileErrors.phoneNumber && (
                      <p className="mt-1 text-xs text-red-600">{profileErrors.phoneNumber.message}</p>
                    )}
                  </div>

                  <div className="pt-2 flex items-center gap-4">
                    <button
                      type="submit"
                      className="bg-black px-5 py-3 text-sm text-white disabled:opacity-40"
                      disabled={!isProfileValid || updateProfileMutation.isPending}
                    >
                      {updateProfileMutation.isPending ? "Đang lưu…" : "Lưu thay đổi"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowChangePasswordModal(true)}
                      className="border border-black px-4 py-3 text-sm hover:bg-zinc-100 font-medium"
                    >
                      Đổi mật khẩu
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Tab Addresses */}
            {tab === "addresses" && (
              <div>
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-medium">Sổ địa chỉ</h2>
                  <button
                    onClick={() => setEditingAddress({})}
                    className="border border-black px-4 py-2 text-sm hover:bg-zinc-100 font-medium"
                  >
                    + Thêm địa chỉ mới
                  </button>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {addressesQuery.isLoading ? (
                    <p className="text-sm">Đang tải địa chỉ…</p>
                  ) : addressRows.length ? (
                    addressRows.map((address) => (
                      <article key={address.id} className="border border-black p-5 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start">
                            <strong>{address.recipientName || address.receiverName || address.fullName}</strong>
                            {address.isDefault && <StatusBadge status="ACTIVE" />}
                          </div>
                          <p className="mt-3 text-sm text-zinc-700">
                            {[
                              address.phone,
                              address.detailAddress || address.addressLine,
                              address.ward,
                              address.district,
                              address.province,
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                          {address.note && (
                            <p className="mt-2 text-xs italic text-zinc-500">Ghi chú: {address.note}</p>
                          )}
                        </div>

                        <div className="mt-5 flex gap-4 border-t border-zinc-200 pt-3">
                          <button
                            onClick={() => setEditingAddress(address)}
                            className="underline text-sm font-medium"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => removeAddressMutation.mutate(address.id)}
                            className="underline text-sm font-medium text-red-700"
                          >
                            Xóa
                          </button>
                          {!address.isDefault && (
                            <button
                              onClick={() =>
                                profileService
                                  .setDefaultAddress(address.id)
                                  .then(() => queryClient.invalidateQueries({ queryKey: ["addresses"] }))
                              }
                              className="underline text-sm font-medium text-zinc-700"
                            >
                              Đặt mặc định
                            </button>
                          )}
                        </div>
                      </article>
                    ))
                  ) : (
                    <p className="text-zinc-500 text-sm">Bạn chưa lưu địa chỉ nào.</p>
                  )}
                </div>

                {editingAddress && (
                  <AddressForm
                    initial={editingAddress}
                    onClose={() => setEditingAddress(null)}
                    onSave={(data) => saveAddressMutation.mutate({ ...data, id: editingAddress.id })}
                    isPending={saveAddressMutation.isPending}
                  />
                )}
              </div>
            )}

            {/* Tab Orders */}
            {tab === "orders" && (
              <div>
                <h2 className="text-2xl font-medium">Đơn hàng của tôi</h2>
                <div className="mt-6 space-y-4">
                  {ordersQuery.isLoading ? (
                    <p className="text-sm">Đang tải đơn hàng…</p>
                  ) : orderRows.length ? (
                    orderRows.map((order) => (
                      <article
                        key={order.id}
                        className="border border-black p-5 space-y-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 pb-3">
                          <div>
                            <span className="text-xs text-zinc-500 block font-mono">MÃ ĐƠN HÀNG</span>
                            <strong className="text-base font-mono">{order.id}</strong>
                          </div>
                          <div className="flex items-center gap-3">
                            <StatusBadge status={order.status} />
                            {["PENDING", "CONFIRMED"].includes(order.status) && (
                              <button
                                onClick={() => setCancelOrderId(String(order.id))}
                                className="border border-red-700 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-50 cursor-pointer"
                              >
                                Hủy đơn
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Order Items Preview */}
                        <div className="space-y-2">
                          {order.items?.map((item: any) => {
                            const unitPrice = Number(item.priceAtPurchase ?? item.price ?? 0);
                            const lineTotal = Number(item.lineTotal ?? (unitPrice * Number(item.quantity || 1)));

                            return (
                              <div key={item.id} className="flex justify-between items-center text-sm py-1.5 border-b border-dashed border-zinc-200 last:border-none">
                                <div className="space-y-0.5">
                                  <p className="font-bold">{item.productName}</p>
                                  {item.variantName && (
                                    <p className="text-xs text-zinc-500">Cấu hình: {item.variantName} × {item.quantity}</p>
                                  )}
                                </div>
                                <div className="text-right font-mono">
                                  <p className="font-bold">{lineTotal.toLocaleString("vi-VN")} ₫</p>
                                  <p className="text-[11px] text-zinc-500">{unitPrice.toLocaleString("vi-VN")} ₫ / sp</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Order Total & Info */}
                        <div className="flex flex-wrap items-center justify-between pt-3 border-t border-black/10 text-xs text-zinc-600">
                          <div>
                            <span>Ngày đặt: <strong>{new Date(order.createdAt || Date.now()).toLocaleDateString("vi-VN")}</strong></span>
                            {order.shippingAddress && (
                              <span className="ml-4 block sm:inline">Giao tới: <strong>{order.shippingAddress}</strong></span>
                            )}
                          </div>
                          <div className="text-right">
                            <span>Tổng tiền đơn: </span>
                            <strong className="text-base font-extrabold text-black font-mono">
                              {Number(order.totalAmount || order.total || 0).toLocaleString("vi-VN")} ₫
                            </strong>
                          </div>
                        </div>
                      </article>
                    ))
                  ) : (
                    <p className="text-zinc-500 text-sm">Bạn chưa có đơn hàng nào.</p>
                  )}
                </div>
              </div>
            )}
          </main>
        </div>
      </section>

      {/* Confirm Dialog Hủy đơn hàng */}
      <ConfirmDialog
        open={!!cancelOrderId}
        onOpenChange={(v) => !v && setCancelOrderId(null)}
        title="Hủy đơn hàng?"
        description="Thao tác này không thể hoàn tác. Bạn chắc chắn muốn hủy đơn hàng này?"
        danger
        confirmText="Hủy đơn"
        onConfirm={() => {
          if (cancelOrderId) cancelOrderMutation.mutate(cancelOrderId);
          setCancelOrderId(null);
        }}
      />

      {/* Modal Đổi Mật Khẩu qua OTP */}
      {showChangePasswordModal && (
        <ChangePasswordModal
          userEmail={user.email}
          onClose={() => setShowChangePasswordModal(false)}
        />
      )}
    </PublicLayout>
  );
}

/** Component Modal Đổi mật khẩu trong Account tab profile */
function ChangePasswordModal({ userEmail, onClose }: { userEmail: string; onClose: () => void }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [rePassword, setRePassword] = useState("");
  const [showNewPass, setShowNewPass] = useState(false);
  const [showRePass, setShowRePass] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const sendOtpMutation = useMutation({
    mutationFn: () => authService.forgotPassword(userEmail),
    onSuccess: () => {
      notifySuccess("Mã OTP đã được gửi đến email của bạn!");
      setStep(2);
    },
    onError: (err: any) => {
      setErrorMsg(err?.message || err?.response?.data?.message || "Không thể gửi OTP. Vui lòng thử lại.");
    },
  });

  const resetPassMutation = useMutation({
    mutationFn: () =>
      authService.resetPassword({ email: userEmail, otp, newPassword }),
    onSuccess: () => {
      notifySuccess("Đổi mật khẩu thành công!");
      onClose();
    },
    onError: (err: any) => {
      setErrorMsg(err?.message || err?.response?.data?.message || "Mã OTP không đúng hoặc đã hết hạn.");
    },
  });

  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
  const isMinLength = newPassword.length >= 8;
  const isPassValid = hasLowercase && hasNumber && hasSpecialChar && isMinLength;

  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (newPassword !== rePassword) {
      setErrorMsg("Mật khẩu nhập lại không trùng khớp!");
      return;
    }
    resetPassMutation.mutate();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div className="w-full max-w-md border border-black bg-white p-6 shadow-lg">
        <h3 className="text-xl font-medium">Đổi mật khẩu</h3>

        {errorMsg && (
          <div className="mt-3 p-3 bg-red-50 border border-red-500 text-red-700 text-xs font-medium">
            {errorMsg}
          </div>
        )}

        {step === 1 && (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-zinc-600">
              Mã xác thực OTP sẽ được gửi về email của bạn: <strong>{userEmail}</strong>
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="border border-black px-4 py-2 text-sm hover:bg-zinc-100"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => sendOtpMutation.mutate()}
                disabled={sendOtpMutation.isPending}
                className="bg-black px-4 py-2 text-sm text-white disabled:opacity-40"
              >
                {sendOtpMutation.isPending ? "Đang gửi OTP..." : "Gửi mã OTP"}
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleStep2Submit} className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium">Mã OTP (6 chữ số) *</label>
              <input
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Nhập 6 chữ số OTP"
                className="mt-1 w-full border border-black px-3 py-2 text-sm tracking-widest font-mono"
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Mật khẩu mới *</label>
              <div className="relative flex items-center mt-1">
                <input
                  required
                  type={showNewPass ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mật khẩu mới"
                  className="w-full border border-black px-3 py-2 pr-10 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute right-3 text-zinc-500"
                >
                  {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password checklist */}
              {newPassword.length > 0 && (
                <div className="space-y-1 pt-2 text-xs">
                  {[
                    { ok: hasLowercase, label: "Ít nhất 1 chữ thường" },
                    { ok: hasNumber, label: "Ít nhất 1 số" },
                    { ok: hasSpecialChar, label: "Ít nhất 1 ký tự đặc biệt" },
                    { ok: isMinLength, label: "Ít nhất 8 ký tự" },
                  ].map(({ ok, label }) => (
                    <div key={label} className="flex items-center gap-2">
                      <span
                        className={`w-3.5 h-3.5 flex items-center justify-center border text-[9px] ${ok ? "bg-green-600 border-green-600 text-white" : "border-zinc-400"
                          }`}
                      >
                        {ok && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </span>
                      <span className={ok ? "text-green-600" : "text-zinc-500"}>{label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium">Nhập lại mật khẩu mới *</label>
              <div className="relative flex items-center mt-1">
                <input
                  required
                  type={showRePass ? "text" : "password"}
                  value={rePassword}
                  onChange={(e) => setRePassword(e.target.value)}
                  placeholder="Xác nhận mật khẩu mới"
                  className="w-full border border-black px-3 py-2 pr-10 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowRePass(!showRePass)}
                  className="absolute right-3 text-zinc-500"
                >
                  {showRePass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="border border-black px-4 py-2 text-sm hover:bg-zinc-100"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={!otp || !isPassValid || resetPassMutation.isPending}
                className="bg-black px-4 py-2 text-sm text-white disabled:opacity-40"
              >
                {resetPassMutation.isPending ? "Đang đổi mật khẩu..." : "Xác nhận đổi"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
