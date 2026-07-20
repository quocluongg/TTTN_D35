"use client";

import React, { useState } from "react";
import Link from "next/link";
import PublicLayout from "@/shared/layouts/PublicLayout";
import { CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState("");
  const [rePassword, setRePassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showRePassword, setShowRePassword] = useState(false);

  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [mismatchError, setMismatchError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMismatchError(false);

    if (newPassword !== rePassword) {
      setMismatchError(true);
      return;
    }

    setIsPending(true);

    // Simulate saving new password
    setTimeout(() => {
      setIsPending(false);
      setIsSuccess(true);
    }, 1000);
  };

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
              {/* Input 1: New Password */}
              <div className="space-y-2">
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
                    {showNewPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
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
                    {showRePassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>

                {/* Password Mismatch Error Message */}
                {mismatchError && (
                  <p className="text-[#E01715] text-[16px] font-medium pt-1 leading-snug">
                    Passwords do not match. Please make sure both passwords are the same.
                  </p>
                )}
              </div>

              {/* Primary Action Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isPending}
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
        </div>
      </div>
    </PublicLayout>
  );
}
