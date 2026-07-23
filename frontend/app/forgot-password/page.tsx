"use client";

import React, { useState } from "react";
import Link from "next/link";
import PublicLayout from "@/shared/layouts/PublicLayout";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { useForgotPassword } from "@/hooks/useAuth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const { mutate: forgotPassword, isPending } = useForgotPassword();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setErrorMsg("");

    forgotPassword(email, {
      onSuccess: () => {
        setIsSubmitted(true);
      },
      onError: (err: any) => {
        const msg =
          err?.message ||
          err?.response?.data?.message ||
          "Không thể gửi email đặt lại mật khẩu. Vui lòng thử lại.";
        setErrorMsg(msg);
      },
    });
  };

  return (
    <PublicLayout fullWidth>
      <div className="w-full bg-[#F2F2F2] dark:bg-zinc-950 min-h-[calc(100vh-60px)] flex items-center justify-center py-16 lg:py-24 px-4 transition-colors duration-300">
        <div className="w-full max-w-[448px] mx-auto space-y-8 text-black dark:text-white">
          {/* Header Title & Subtitle */}
          <div className="space-y-3">
            <h1 className="text-[36px] sm:text-[48px] font-bold tracking-tight leading-[1.1]">
              Forgot Your Password?
            </h1>
            <p className="text-[16px] text-zinc-600 dark:text-zinc-400 font-medium">
              Enter your email address to receive a password reset link.
            </p>
          </div>

          {/* Submitted Success Message or Form */}
          {isSubmitted ? (
            <div className="p-6 bg-white dark:bg-zinc-900 border border-black dark:border-zinc-700 space-y-4 text-center">
              <CheckCircle2 className="w-12 h-12 text-[#1CCA00] mx-auto" />
              <h3 className="text-xl font-bold">Email Reset Đã Được Gửi</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Chúng tôi đã gửi hướng dẫn khôi phục mật khẩu tới{" "}
                <span className="font-semibold text-black dark:text-white">{email}</span>.
                Vui lòng kiểm tra hộp thư đến của bạn.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center justify-center w-full h-[54px] bg-black text-white dark:bg-white dark:text-black font-medium text-[18px] hover:bg-zinc-800 transition-colors"
              >
                Trở về Đăng nhập
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {errorMsg && (
                <div className="p-4 bg-red-50 dark:bg-red-950/50 border border-[#E01715] text-[#E01715] dark:text-red-400 text-sm font-medium">
                  {errorMsg}
                </div>
              )}

              {/* Email Input */}
              <div className="space-y-2">
                <label className="block text-[18px] sm:text-[20px] font-medium">
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  required
                  disabled={isPending}
                  className="w-full h-[54px] px-4 bg-white dark:bg-zinc-900 border border-black dark:border-zinc-700 text-[18px] text-black dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all disabled:opacity-50"
                />
              </div>

              {/* Action Button */}
              <button
                type="submit"
                disabled={isPending}
                className="w-full h-[54px] bg-black text-white dark:bg-white dark:text-black border border-black dark:border-white text-[20px] font-medium flex items-center justify-center gap-2 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Sending...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </button>

              {/* Back to Login Link */}
              <div className="pt-2 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-[16px] font-medium text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Quay lại Đăng nhập
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </PublicLayout>
  );
}
