"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { authService } from "@/services/authService";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function SignUpForm() {
  const router = useRouter();
  const [step, setStep] = useState<"register" | "otp">("register");

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Register Mutation
  const registerMutation = useMutation({
    mutationFn: () => {
      if (form.password.length < 8) {
        throw new Error("Password must be at least 8 characters.");
      }
      return authService.register({
        email: form.email.trim(),
        password: form.password,
        fullName: form.fullName.trim(),
      });
    },
    onSuccess: () => {
      setErrorMsg("");
      setStep("otp");
    },
    onError: (err: any) => {
      setErrorMsg(err?.response?.data?.message || err?.message || "Registration failed. Please check your information!");
    },
  });

  // Verify OTP Mutation
  const verifyMutation = useMutation({
    mutationFn: () =>
      authService.verifyOtp({
        email: form.email.trim(),
        otp: otp.trim(),
      }),
    onSuccess: () => {
      router.push("/login");
    },
    onError: (err: any) => {
      setErrorMsg(err?.response?.data?.message || err?.message || "Invalid or expired OTP code!");
    },
  });

  // Resend OTP Mutation
  const resendMutation = useMutation({
    mutationFn: () => authService.resendOtp(form.email.trim()),
    onSuccess: () => {
      setErrorMsg("");
      alert("A new OTP code has been sent to your email!");
    },
    onError: (err: any) => {
      setErrorMsg(err?.response?.data?.message || err?.message || "Could not resend OTP code at this time.");
    },
  });

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!form.fullName || !form.email || !form.password) {
      setErrorMsg("Please fill in all required fields.");
      return;
    }

    registerMutation.mutate();
  };

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!otp) {
      setErrorMsg("Please enter the 6-digit OTP code.");
      return;
    }

    verifyMutation.mutate();
  };

  return (
    <div className="w-full max-w-[448px] mx-auto space-y-8 text-black dark:text-white">
      
      {/* Title Header - Matching LoginForm */}
      <div className="space-y-2">
        <h1 className="text-[36px] sm:text-[48px] font-bold tracking-tight leading-[1.1]">
          {step === "register" ? "Sign Up" : "Verify OTP"}
        </h1>
        {step === "otp" && (
          <p className="text-[16px] text-zinc-500 font-medium">
            Enter the 6-digit OTP code sent to <strong className="text-black dark:text-white">{form.email}</strong>
          </p>
        )}
      </div>

      {/* STEP 1: REGISTER FORM */}
      {step === "register" ? (
        <form onSubmit={handleRegisterSubmit} className="space-y-6">
          {errorMsg && (
            <div className="p-4 bg-red-50 dark:bg-red-950/50 border border-[#E01715] text-[#E01715] dark:text-red-400 text-sm font-medium">
              {errorMsg}
            </div>
          )}

          {/* Input 1: Full Name */}
          <div className="space-y-2">
            <label className="block text-[18px] sm:text-[20px] font-medium">
              Full Name
            </label>
            <input
              type="text"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              placeholder="Full Name"
              required
              disabled={registerMutation.isPending}
              className="w-full h-[54px] px-4 bg-white dark:bg-zinc-900 border border-black dark:border-zinc-700 text-[18px] text-black dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all disabled:opacity-50"
            />
          </div>

          {/* Input 2: Email Address */}
          <div className="space-y-2">
            <label className="block text-[18px] sm:text-[20px] font-medium">
              Email address
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="Email address"
              required
              disabled={registerMutation.isPending}
              className="w-full h-[54px] px-4 bg-white dark:bg-zinc-900 border border-black dark:border-zinc-700 text-[18px] text-black dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all disabled:opacity-50"
            />
          </div>

          {/* Input 3: Password */}
          <div className="space-y-2">
            <label className="block text-[18px] sm:text-[20px] font-medium">
              Password (Min 8 characters)
            </label>
            <div className="relative flex items-center">
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Password"
                required
                minLength={8}
                disabled={registerMutation.isPending}
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

          {/* Action Buttons */}
          <div className="space-y-4 pt-2">
            <button
              type="submit"
              disabled={registerMutation.isPending}
              className="w-full h-[54px] bg-black text-white dark:bg-white dark:text-black border border-black dark:border-white text-[20px] font-medium flex items-center justify-center gap-2 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors cursor-pointer disabled:opacity-50"
            >
              {registerMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Submitting...
                </>
              ) : (
                "Continue"
              )}
            </button>

            <Link
              href="/login"
              className="w-full h-[54px] bg-[#F2F2F2] dark:bg-zinc-900 text-black dark:text-white border border-black dark:border-zinc-700 text-[20px] font-medium flex items-center justify-center hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
            >
              Back to Log In
            </Link>
          </div>
        </form>
      ) : (
        /* STEP 2: VERIFY OTP FORM */
        <form onSubmit={handleVerifySubmit} className="space-y-6">
          {errorMsg && (
            <div className="p-4 bg-red-50 dark:bg-red-950/50 border border-[#E01715] text-[#E01715] dark:text-red-400 text-sm font-medium">
              {errorMsg}
            </div>
          )}

          {/* Input OTP */}
          <div className="space-y-2">
            <label className="block text-[18px] sm:text-[20px] font-medium">
              OTP Code (6 digits)
            </label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="123456"
              maxLength={6}
              inputMode="numeric"
              required
              disabled={verifyMutation.isPending}
              className="w-full h-[54px] px-4 bg-white dark:bg-zinc-900 border border-black dark:border-zinc-700 text-[24px] font-mono tracking-[0.4em] text-center text-black dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all disabled:opacity-50"
            />
          </div>

          {/* Action Buttons */}
          <div className="space-y-4 pt-2">
            <button
              type="submit"
              disabled={verifyMutation.isPending}
              className="w-full h-[54px] bg-black text-white dark:bg-white dark:text-black border border-black dark:border-white text-[20px] font-medium flex items-center justify-center gap-2 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors cursor-pointer disabled:opacity-50"
            >
              {verifyMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Verifying...
                </>
              ) : (
                "Verify & Complete"
              )}
            </button>

            <div className="flex items-center justify-between pt-1 text-sm font-medium">
              <button
                type="button"
                onClick={() => setStep("register")}
                className="text-zinc-600 dark:text-zinc-400 hover:underline"
              >
                Change Info
              </button>
              <button
                type="button"
                disabled={resendMutation.isPending}
                onClick={() => resendMutation.mutate()}
                className="text-black dark:text-white underline font-bold"
              >
                {resendMutation.isPending ? "Resending..." : "Resend OTP"}
              </button>
            </div>
          </div>
        </form>
      )}

    </div>
  );
}
