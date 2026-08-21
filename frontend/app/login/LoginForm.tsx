"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useLogin, useGoogleLogin } from "@/hooks/useAuth";
import { loadGoogleScript, getGoogleClientId } from "@/lib/google";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function LoginForm() {
  const { mutate: login, isPending } = useLogin();
  const { mutate: googleLogin, isPending: isGooglePending } = useGoogleLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const googleTokenClient = useRef<any>(null);

  useEffect(() => {
    // 1. Process Google Redirect Callback if URL hash contains id_token
    if (typeof window !== "undefined" && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const idToken = hashParams.get("id_token") || hashParams.get("credential");

      if (idToken) {
        window.history.replaceState(null, "", window.location.pathname);
        googleLogin(idToken);
        return;
      }
    }

    // 2. Initialize GIS (Google Identity Services) with redirect mode
    const clientId = getGoogleClientId();
    if (!clientId) return;

    let cancelled = false;
    loadGoogleScript()
      .then((google) => {
        if (cancelled || !google?.accounts?.id) return;

        google.accounts.id.initialize({
          client_id: clientId,
          ux_mode: "redirect",
          login_uri: typeof window !== "undefined" ? window.location.origin + "/login" : undefined,
          callback: (response: any) => {
            if (response?.credential) {
              googleLogin(response.credential);
            }
          },
        });

        const btnContainer = document.getElementById("google-official-btn");
        if (btnContainer) {
          google.accounts.id.renderButton(btnContainer, {
            type: "standard",
            theme: "outline",
            size: "large",
            text: "signin_with",
            shape: "rectangular",
            logo_alignment: "left",
            width: "380",
          });
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [googleLogin]);

  const handleGoogleLogin = () => {
    const clientId = getGoogleClientId();
    if (!clientId) {
      setErrorMsg("Google Client ID chưa được cấu hình.");
      return;
    }

    // If official Google GIS button exists, click it
    const innerBtn = document.querySelector("#google-official-btn div[role=button]") as HTMLElement;
    if (innerBtn) {
      innerBtn.click();
      return;
    }

    if (typeof window !== "undefined" && (window as any).google?.accounts?.id) {
      (window as any).google.accounts.id.prompt();
    } else {
      const redirectUri = window.location.origin + "/login";
      const nonce = Date.now().toString();
      const googleAuthUrl =
        `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${encodeURIComponent(clientId)}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=id_token` +
        `&scope=${encodeURIComponent("openid email profile")}` +
        `&prompt=select_account` +
        `&nonce=${encodeURIComponent(nonce)}`;

      window.location.href = googleAuthUrl;
    }
  };

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
          Đăng nhập
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
            Địa chỉ Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Nhập email của bạn"
            required
            disabled={isPending}
            className="w-full h-[54px] px-4 bg-white dark:bg-zinc-900 border border-black dark:border-zinc-700 text-[18px] text-black dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all disabled:opacity-50"
          />
        </div>

        {/* Input 2: Password */}
        <div className="space-y-2">
          <label className="block text-[18px] sm:text-[20px] font-medium">
            Mật khẩu
          </label>
          <div className="relative flex items-center">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu"
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
            Quên mật khẩu?
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
                <Loader2 className="w-5 h-5 animate-spin" /> Đang đăng nhập...
              </>
            ) : (
              "Đăng nhập"
            )}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 py-1">
            <div className="h-px flex-1 bg-zinc-300 dark:bg-zinc-700" />
            <span className="text-sm text-zinc-500">hoặc</span>
            <div className="h-px flex-1 bg-zinc-300 dark:bg-zinc-700" />
          </div>

          {/* Google Login Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isGooglePending}
            className="w-full h-[54px] bg-white dark:bg-zinc-900 text-black dark:text-white border border-zinc-300 dark:border-zinc-700 text-[18px] font-medium flex items-center justify-center gap-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-50"
          >
            {isGooglePending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Đang đăng nhập...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"
                  />
                </svg>
                Đăng nhập bằng Google
              </>
            )}
          </button>

          {/* Hidden container for official Google Identity Services button */}
          <div id="google-official-btn" className="hidden" />

          {/* Secondary Button */}
          <Link
            href="/signup"
            className="w-full h-[54px] bg-[#F2F2F2] dark:bg-zinc-900 text-black dark:text-white border border-black dark:border-zinc-700 text-[20px] font-medium flex items-center justify-center hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
          >
            Tạo tài khoản mới
          </Link>
        </div>
      </form>
    </div>
  );
}
