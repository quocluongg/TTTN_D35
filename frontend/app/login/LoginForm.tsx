"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useLogin } from "@/hooks/useAuth";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function LoginForm() {
  const { mutate: login, isPending } = useLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!email || !password) {
      setErrorMsg("Vui lòng điền đầy đủ Email và Mật khẩu.");
      return;
    }

    login(
      { email, password },
      {
        onError: (err: any) => {
          setErrorMsg(err?.response?.data?.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin!");
        },
      }
    );
  };

  return (
    <div className="w-full max-w-[448px] mx-auto space-y-8 text-black dark:text-white">
      {/* Title Header */}
      <div className="space-y-2">
        <h1 className="text-[36px] sm:text-[48px] font-bold tracking-tight leading-[1.1]">
          Log In
        </h1>
      </div>

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {errorMsg && (
          <div className="p-4 bg-red-50 dark:bg-red-950/50 border border-[#E01715] text-[#E01715] dark:text-red-400 text-sm font-medium">
            {errorMsg}
          </div>
        )}

        {/* Input 1: Email Address */}
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

        {/* Input 2: Password */}
        <div className="space-y-2">
          <label className="block text-[18px] sm:text-[20px] font-medium">
            Password
          </label>
          <div className="relative flex items-center">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              disabled={isPending}
              className="w-full h-[54px] pl-4 pr-12 bg-white dark:bg-zinc-900 border border-black dark:border-zinc-700 text-[18px] text-black dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 text-zinc-500 hover:text-black dark:hover:text-white focus:outline-none"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Forgot Password Link */}
        <div>
          <Link
            href="/forgot-password"
            className="text-[16px] font-medium text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white underline transition-colors"
          >
            Forgot your password?
          </Link>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4 pt-2">
          {/* Primary Button */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full h-[54px] bg-black text-white dark:bg-white dark:text-black border border-black dark:border-white text-[20px] font-medium flex items-center justify-center gap-2 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors cursor-pointer disabled:opacity-50"
          >
            {isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Log In...
              </>
            ) : (
              "Log In"
            )}
          </button>

          {/* Secondary Button */}
          <Link
            href="/signup"
            className="w-full h-[54px] bg-[#F2F2F2] dark:bg-zinc-900 text-black dark:text-white border border-black dark:border-zinc-700 text-[20px] font-medium flex items-center justify-center hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
          >
            Create an Account
          </Link>
        </div>
      </form>
    </div>
  );
}
