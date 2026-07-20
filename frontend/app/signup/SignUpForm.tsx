"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSignup } from "@/hooks/useAuth";
import { Check, Eye, EyeOff, Loader2 } from "lucide-react";

export default function SignUpForm() {
  const { mutate: signup, isPending } = useSignup();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [agreeTerms, setAgreeTerms] = useState(false);
  const [subscribeUpdates, setSubscribeUpdates] = useState(false);
  const [subscribeTexts, setSubscribeTexts] = useState(false);

  const [errorMsg, setErrorMsg] = useState("");

  // Validation rules for password
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const isMinLength = password.length >= 8;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!firstName || !lastName || !email || !password) {
      setErrorMsg("Vui lòng nhập đầy đủ thông tin cá nhân và mật khẩu.");
      return;
    }

    if (!agreeTerms) {
      setErrorMsg("Bạn cần đồng ý với Điều khoản sử dụng và Chính sách bảo mật.");
      return;
    }

    if (!hasLowercase || !hasNumber || !hasSpecialChar || !isMinLength) {
      setErrorMsg("Mật khẩu chưa đáp ứng đủ các yêu cầu an toàn.");
      return;
    }

    signup(
      {
        fullName: `${firstName} ${lastName}`.trim(),
        email,
        password,
      },
      {
        onError: (err: any) => {
          setErrorMsg(err?.response?.data?.message || "Đăng ký thất bại. Vui lòng thử lại!");
        },
      }
    );
  };

  return (
    <div className="w-full max-w-[448px] mx-auto space-y-8 text-black dark:text-white">
      {/* Title Header */}
      <div className="space-y-2">
        <h1 className="text-[36px] sm:text-[48px] font-bold tracking-tight leading-[1.1]">
          Create an Account
        </h1>
      </div>

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {errorMsg && (
          <div className="p-4 bg-red-50 dark:bg-red-950/50 border border-[#E01715] text-[#E01715] dark:text-red-400 text-sm font-medium">
            {errorMsg}
          </div>
        )}

        {/* Input 1: First Name */}
        <div className="space-y-2">
          <label className="block text-[18px] sm:text-[20px] font-medium">
            First name
          </label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="First name"
            required
            disabled={isPending}
            className="w-full h-[54px] px-4 bg-white dark:bg-zinc-900 border border-black dark:border-zinc-700 text-[18px] text-black dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all disabled:opacity-50"
          />
        </div>

        {/* Input 2: Last Name */}
        <div className="space-y-2">
          <label className="block text-[18px] sm:text-[20px] font-medium">
            Last name
          </label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Last name"
            required
            disabled={isPending}
            className="w-full h-[54px] px-4 bg-white dark:bg-zinc-900 border border-black dark:border-zinc-700 text-[18px] text-black dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all disabled:opacity-50"
          />
        </div>

        {/* Input 3: Email Address */}
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

        {/* Input 4: Password */}
        <div className="space-y-3">
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

          {/* Password Validation Checklist */}
          <div className="space-y-2 pt-1 text-[15px] font-medium">
            <div className="flex items-center gap-2">
              <span className={`w-4 h-4 flex items-center justify-center border ${hasLowercase ? "bg-[#1CCA00] border-[#1CCA00] text-white" : "border-zinc-400"}`}>
                {hasLowercase && <Check className="w-3 h-3 stroke-[3]" />}
              </span>
              <span className={hasLowercase ? "text-[#1CCA00]" : "text-zinc-500"}>
                Contains one lowercase letter
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className={`w-4 h-4 flex items-center justify-center border ${hasNumber ? "bg-[#1CCA00] border-[#1CCA00] text-white" : "border-zinc-400"}`}>
                {hasNumber && <Check className="w-3 h-3 stroke-[3]" />}
              </span>
              <span className={hasNumber ? "text-[#1CCA00]" : "text-zinc-500"}>
                Contains one number
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className={`w-4 h-4 flex items-center justify-center border ${hasSpecialChar ? "bg-[#1CCA00] border-[#1CCA00] text-white" : "border-zinc-400"}`}>
                {hasSpecialChar && <Check className="w-3 h-3 stroke-[3]" />}
              </span>
              <span className={hasSpecialChar ? "text-[#1CCA00]" : "text-zinc-500"}>
                Contains one special character
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className={`w-4 h-4 flex items-center justify-center border ${isMinLength ? "bg-[#1CCA00] border-[#1CCA00] text-white" : "border-zinc-400"}`}>
                {isMinLength && <Check className="w-3 h-3 stroke-[3]" />}
              </span>
              <span className={isMinLength ? "text-[#1CCA00]" : "text-zinc-500"}>
                At least 8 characters
              </span>
            </div>
          </div>
        </div>

        {/* Checkboxes */}
        <div className="space-y-4 pt-2 text-[15px]">
          {/* Checkbox 1 */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="mt-1 w-4 h-4 border border-black rounded-none text-black focus:ring-0"
            />
            <span className="text-zinc-700 dark:text-zinc-300 leading-snug">
              By clicking here, I agree to the Terms of Use and Privacy Policy.
            </span>
          </label>

          {/* Checkbox 2 */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={subscribeUpdates}
              onChange={(e) => setSubscribeUpdates(e.target.checked)}
              className="mt-1 w-4 h-4 border border-black rounded-none text-black focus:ring-0"
            />
            <span className="text-zinc-700 dark:text-zinc-300 leading-snug">
              Subscribe for updates on products, events, and more. Unsubscribe anytime.
            </span>
          </label>

          {/* Checkbox 3 */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={subscribeTexts}
              onChange={(e) => setSubscribeTexts(e.target.checked)}
              className="mt-1 w-4 h-4 border border-black rounded-none text-black focus:ring-0"
            />
            <span className="text-zinc-700 dark:text-zinc-300 leading-snug">
              Get our texts designed to brighten your day. Unsubscribe anytime.
            </span>
          </label>
        </div>

        {/* Primary Action Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isPending}
            className="w-full h-[54px] bg-black text-white dark:bg-white dark:text-black border border-black dark:border-white text-[20px] font-medium flex items-center justify-center gap-2 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors cursor-pointer disabled:opacity-50"
          >
            {isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Creating Account...
              </>
            ) : (
              "Create an Account"
            )}
          </button>
        </div>

        {/* Already have an account link */}
        <div className="text-center pt-2">
          <span className="text-zinc-600 dark:text-zinc-400">Already have an account? </span>
          <Link href="/login" className="font-bold underline hover:text-black dark:hover:text-white">
            Log In
          </Link>
        </div>
      </form>
    </div>
  );
}
