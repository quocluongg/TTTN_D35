"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import PublicLayout from "@/shared/layouts/PublicLayout";
import { AlertTriangle, Check, CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";
import { useResetPassword } from "@/hooks/useAuth";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [rePassword, setRePassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showRePassword, setShowRePassword] = useState(false);
  const [mismatchError, setMismatchError] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const { mutate: resetPassword, isPending } = useResetPassword();

  // Password validation
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
  const isMinLength = newPassword.length >= 8;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMismatchError(false);
    setErrorMsg("");

    if (newPassword !== rePassword) {
      setMismatchError(true);
      return;
    }

    if (!token) {
      setErrorMsg("Liên kết đặt lại mật khẩu không hợp lệ. Vui lòng thử lại từ email.");
      return;
    }

    resetPassword(
      { token, newPassword },
      {
        onSuccess: () => setIsSuccess(true),
        onError: (err: any) => {
          const msg =
            err?.message ||
            err?.response?.data?.message ||
            "Liên kết không hợp lệ hoặc đã hết hạn. Vui lòng gửi lại yêu cầu.";
          setErrorMsg(msg);
        },
      }
    );
  };

  // Nếu không có token trong URL
  if (!token) {
    return (
      <div className="p-6 bg-white dark:bg-zinc-900 border border-[#E01715] space-y-4 text-center">
        <AlertTriangle className="w-12 h-12 text-[#E01715] mx-auto" />
        <h3 className="text-xl font-bold">Liên kết không hợp lệ</h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.
        </p>
        <Link
          href="/forgot-password"
          className="inline-flex items-center justify-center w-full h-[54px] bg-black text-white dark:bg-white dark:text-black font-medium text-[18px] hover:bg-zinc-800 transition-colors"
        >
          Gửi Lại Email
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Success Box or Form */}
      {isSuccess ? (
        <div className="p-6 bg-white dark:bg-zinc-900 border border-black dark:border-zinc-700 space-y-4 text-center">
          <CheckCircle2 className="w-12 h-12 text-[#1CCA00] mx-auto" />
          <h3 className="text-xl font-bold">Mật Khẩu Đã Đổi Thành Công</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Mật khẩu mới của bạn đã được cập nhật. Bạn có thể sử dụng mật khẩu này để đăng nhập ngay bây giờ.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center w-full h-[54px] bg-black text-white dark:bg-white dark:text-black font-medium text-[18px] hover:bg-zinc-800 transition-colors"
          >
            Đăng nhập Ngay
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {errorMsg && (
            <div className="p-4 bg-red-50 dark:bg-red-950/50 border border-[#E01715] text-[#E01715] dark:text-red-400 text-sm font-medium">
              {errorMsg}
            </div>
          )}

          {/* Input 1: New Password */}
          <div className="space-y-3">
            <label className="block text-[18px] sm:text-[20px] font-medium">
              New password
            </label>
            <div className="relative flex items-center">
              <input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (mismatchError) setMismatchError(false);
                }}
                placeholder="New password"
                required
                disabled={isPending}
                className="w-full h-[54px] pl-4 pr-12 bg-white dark:bg-zinc-900 border border-black dark:border-zinc-700 text-[18px] text-black dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-4 text-zinc-500 hover:text-black dark:hover:text-white focus:outline-none"
              >
                {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Password checklist */}
            {newPassword.length > 0 && (
              <div className="space-y-1.5 pt-1 text-[14px] font-medium">
                {[
                  { ok: hasLowercase, label: "Ít nhất 1 chữ thường" },
                  { ok: hasNumber, label: "Ít nhất 1 số" },
                  { ok: hasSpecialChar, label: "Ít nhất 1 ký tự đặc biệt" },
                  { ok: isMinLength, label: "Ít nhất 8 ký tự" },
                ].map(({ ok, label }) => (
                  <div key={label} className="flex items-center gap-2">
                    <span
                      className={`w-4 h-4 flex items-center justify-center border ${
                        ok ? "bg-[#1CCA00] border-[#1CCA00] text-white" : "border-zinc-400"
                      }`}
                    >
                      {ok && <Check className="w-3 h-3 stroke-[3]" />}
                    </span>
                    <span className={ok ? "text-[#1CCA00]" : "text-zinc-500"}>{label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Input 2: Re-enter New Password */}
          <div className="space-y-2">
            <label className="block text-[18px] sm:text-[20px] font-medium">
              Re-enter new password
            </label>
            <div className="relative flex items-center">
              <input
                type={showRePassword ? "text" : "password"}
                value={rePassword}
                onChange={(e) => {
                  setRePassword(e.target.value);
                  if (mismatchError) setMismatchError(false);
                }}
                placeholder="Re-enter new password"
                required
                disabled={isPending}
                className={`w-full h-[54px] pl-4 pr-12 bg-white dark:bg-zinc-900 border ${
                  mismatchError ? "border-[#E01715]" : "border-black dark:border-zinc-700"
                } text-[18px] text-black dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all disabled:opacity-50`}
              />
              <button
                type="button"
                onClick={() => setShowRePassword(!showRePassword)}
                className="absolute right-4 text-zinc-500 hover:text-black dark:hover:text-white focus:outline-none"
              >
                {showRePassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {mismatchError && (
              <p className="text-[#E01715] text-[15px] font-medium pt-1 leading-snug">
                Mật khẩu không trùng khớp. Vui lòng kiểm tra lại.
              </p>
            )}
          </div>

          {/* Primary Action Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isPending || !isMinLength || !hasLowercase || !hasNumber || !hasSpecialChar}
              className="w-full h-[54px] bg-black text-white dark:bg-white dark:text-black border border-black dark:border-white text-[20px] font-medium flex items-center justify-center gap-2 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors cursor-pointer disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Saving...
                </>
              ) : (
                "Save New Password"
              )}
            </button>
          </div>
        </form>
      )}
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <PublicLayout fullWidth>
      <div className="w-full bg-[#F2F2F2] dark:bg-zinc-950 min-h-[calc(100vh-60px)] flex items-center justify-center py-16 lg:py-24 px-4 transition-colors duration-300">
        <div className="w-full max-w-[448px] mx-auto space-y-8 text-black dark:text-white">
          {/* Header Title & Subtitle */}
          <div className="space-y-3">
            <h1 className="text-[36px] sm:text-[48px] font-bold tracking-tight leading-[1.1]">
              Reset Password
            </h1>
            <p className="text-[16px] text-zinc-600 dark:text-zinc-400 font-medium">
              Enter a new password for your account.
            </p>
          </div>

          <Suspense fallback={<div className="h-[300px] animate-pulse bg-zinc-100 dark:bg-zinc-800" />}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </PublicLayout>
  );
}
