"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import PublicLayout from "@/shared/layouts/PublicLayout";
import { Check, CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";
import { useResetPassword, useForgotPassword } from "@/hooks/useAuth";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") || "";

  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [rePassword, setRePassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showRePassword, setShowRePassword] = useState(false);
  const [mismatchError, setMismatchError] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [otpSentMsg, setOtpSentMsg] = useState("");

  const { mutate: resetPassword, isPending } = useResetPassword();
  const { mutate: sendOtp, isPending: isSendingOtp } = useForgotPassword();

  // Password validation
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
  const isMinLength = newPassword.length >= 8;
  const isPasswordValid = hasLowercase && hasNumber && hasSpecialChar && isMinLength;

  const handleSendOtp = () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMsg("Vui lòng nhập email hợp lệ để nhận mã OTP.");
      return;
    }
    setErrorMsg("");
    sendOtp(email, {
      onSuccess: () => {
        setOtpSentMsg("Mã OTP đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư!");
      },
      onError: (err: any) => {
        setErrorMsg(err?.message || err?.response?.data?.message || "Không thể gửi OTP. Vui lòng kiểm tra email.");
      },
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMismatchError(false);
    setErrorMsg("");

    if (newPassword !== rePassword) {
      setMismatchError(true);
      return;
    }

    if (!email) {
      setErrorMsg("Vui lòng nhập Email.");
      return;
    }

    if (!otp) {
      setErrorMsg("Vui lòng nhập mã OTP.");
      return;
    }

    resetPassword(
      { email, otp, newPassword },
      {
        onSuccess: () => setIsSuccess(true),
        onError: (err: any) => {
          const msg =
            err?.message ||
            err?.response?.data?.message ||
            "Mã OTP không hợp lệ hoặc đã hết hạn. Vui lòng thử lại.";
          setErrorMsg(msg);
        },
      }
    );
  };

  return (
    <>
      {isSuccess ? (
        <div className="p-6 bg-white border border-black space-y-4 text-center">
          <CheckCircle2 className="w-12 h-12 text-[#1CCA00] mx-auto" />
          <h3 className="text-xl font-bold">Mật Khẩu Đã Đổi Thành Công</h3>
          <p className="text-sm text-zinc-600">
            Mật khẩu mới của bạn đã được cập nhật. Bạn có thể sử dụng mật khẩu mới này để đăng nhập ngay.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center w-full h-[54px] bg-black text-white font-medium text-[18px] hover:bg-zinc-800 transition-colors"
          >
            Đăng nhập Ngay
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {errorMsg && (
            <div className="p-4 bg-red-50 border border-[#E01715] text-[#E01715] text-sm font-medium">
              {errorMsg}
            </div>
          )}

          {otpSentMsg && (
            <div className="p-4 bg-green-50 border border-green-600 text-green-700 text-sm font-medium">
              {otpSentMsg}
            </div>
          )}

          {/* Email input */}
          <div className="space-y-2">
            <label className="block text-[18px] font-medium">Email *</label>
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Nhập email của bạn"
                required
                disabled={isPending}
                className="flex-1 h-[54px] px-4 bg-white border border-black text-[18px] focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50"
              />
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={isSendingOtp || !email}
                className="px-4 h-[54px] border border-black bg-white hover:bg-zinc-100 text-sm font-medium text-black disabled:opacity-40"
              >
                {isSendingOtp ? "Đang gửi..." : "Gửi OTP"}
              </button>
            </div>
          </div>

          {/* OTP Input */}
          <div className="space-y-2">
            <label className="block text-[18px] font-medium">Mã OTP (6 chữ số) *</label>
            <input
              type="text"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Ví dụ: 123456"
              required
              disabled={isPending}
              className="w-full h-[54px] px-4 bg-white border border-black text-[18px] font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50"
            />
          </div>

          {/* Input: New Password */}
          <div className="space-y-3">
            <label className="block text-[18px] font-medium">Mật khẩu mới *</label>
            <div className="relative flex items-center">
              <input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (mismatchError) setMismatchError(false);
                }}
                placeholder="Mật khẩu mới"
                required
                disabled={isPending}
                className="w-full h-[54px] pl-4 pr-12 bg-white border border-black text-[18px] focus:outline-none focus:ring-2 focus:ring-black transition-all disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-4 text-zinc-500 hover:text-black focus:outline-none"
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

          {/* Input: Re-enter New Password */}
          <div className="space-y-2">
            <label className="block text-[18px] font-medium">Nhập lại mật khẩu mới *</label>
            <div className="relative flex items-center">
              <input
                type={showRePassword ? "text" : "password"}
                value={rePassword}
                onChange={(e) => {
                  setRePassword(e.target.value);
                  if (mismatchError) setMismatchError(false);
                }}
                placeholder="Nhập lại mật khẩu mới"
                required
                disabled={isPending}
                className={`w-full h-[54px] pl-4 pr-12 bg-white border ${
                  mismatchError ? "border-[#E01715]" : "border-black"
                } text-[18px] focus:outline-none focus:ring-2 focus:ring-black transition-all disabled:opacity-50`}
              />
              <button
                type="button"
                onClick={() => setShowRePassword(!showRePassword)}
                className="absolute right-4 text-zinc-500 hover:text-black focus:outline-none"
              >
                {showRePassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {mismatchError && (
              <p className="text-[#E01715] text-[15px] font-medium pt-1 leading-snug">
                Mật khẩu nhập lại không trùng khớp. Vui lòng kiểm tra lại.
              </p>
            )}
          </div>

          {/* Primary Action Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isPending || !isPasswordValid || !otp || !email}
              className="w-full h-[54px] bg-black text-white border border-black text-[20px] font-medium flex items-center justify-center gap-2 hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Đang lưu...
                </>
              ) : (
                "Lưu mật khẩu mới"
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
      <div className="w-full bg-[#F2F2F2] min-h-[calc(100vh-60px)] flex items-center justify-center py-16 lg:py-24 px-4">
        <div className="w-full max-w-[448px] mx-auto space-y-8 text-black">
          <div className="space-y-3">
            <h1 className="text-[36px] sm:text-[48px] font-bold tracking-tight leading-[1.1]">
              Đặt lại mật khẩu
            </h1>
            <p className="text-[16px] text-zinc-600 font-medium">
              Nhập mã OTP từ email và mật khẩu mới cho tài khoản của bạn.
            </p>
          </div>

          <Suspense fallback={<div className="h-[300px] animate-pulse bg-zinc-200" />}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </PublicLayout>
  );
}
