"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import {
  authService,
  type LoginPayload,
  type RegisterPayload,
  type TokenResponse,
  type User,
} from "@/services/authService";
import type { ApiResponse } from "@/services/apiTypes";
import { profileService } from "@/services/profileService";
import { notifyError, notifySuccess } from "@/components/Notify";
import { useAuthStore } from "@/store/authStore";

export const CURRENT_USER_KEY = ["currentUser"];

function extractErrorMessage(error: any, fallback: string): string {
  return error?.response?.data?.message || error?.message || fallback;
}

// ─── Đăng nhập ────────────────────────────────────────────────────────────────
export const useLogin = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: LoginPayload) => authService.login(data),
    onSuccess: async (response: ApiResponse<TokenResponse>) => {
      const tokenData = response?.data;
      if (!tokenData?.accessToken) return;

      Cookies.set("token", tokenData.accessToken, { expires: 7 });
      useAuthStore.getState().setAuth(tokenData.accessToken);

      // Backend không trả user kèm token (xem TokenResponse.java) -> tự fetch /profile/me
      // ngay sau khi có accessToken để biết role (điều hướng admin/customer) và hiển thị tên/avatar.
      const profileRes: any = await profileService.me().catch(() => null);
      const profile: User | null = profileRes?.data ?? null;

      if (profile) {
        Cookies.set(
          "user",
          JSON.stringify({
            name: profile.fullName,
            email: profile.email,
            role: String(profile.role || "").toUpperCase(),
            avatar: profile.avatarUrl,
          }),
          { expires: 7 }
        );
        queryClient.setQueryData(CURRENT_USER_KEY, profile);
      }

      queryClient.invalidateQueries({ queryKey: CURRENT_USER_KEY });
      notifySuccess("Đăng nhập thành công!");

      const role = String(profile?.role || "").toUpperCase();
      router.push(role.includes("ADMIN") || role.includes("EMPLOYEE") ? "/admin" : "/");
    },
    onError: (error: any) => {
      notifyError(extractErrorMessage(error, "Email hoặc mật khẩu không đúng. Vui lòng thử lại!"));
    },
  });
};

// ─── Đăng nhập bằng Google ─────────────────────────────────────────────────────
export const useGoogleLogin = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (idToken: string) => authService.googleLogin(idToken),
    onSuccess: async (response: ApiResponse<TokenResponse>) => {
      const tokenData = response?.data;
      if (!tokenData?.accessToken) return;

      Cookies.set("token", tokenData.accessToken, { expires: 7 });
      useAuthStore.getState().setAuth(tokenData.accessToken);

      const profileRes: any = await profileService.me().catch(() => null);
      const profile: User | null = profileRes?.data ?? null;
      if (profile) {
        queryClient.setQueryData(CURRENT_USER_KEY, profile);
      }

      queryClient.invalidateQueries({ queryKey: CURRENT_USER_KEY });
      notifySuccess("Đăng nhập bằng Google thành công!");

      const role = String(profile?.role || "").toUpperCase();
      router.push(role.includes("ADMIN") || role.includes("EMPLOYEE") ? "/admin" : "/");
    },
    onError: (error: any) => {
      notifyError(extractErrorMessage(error, "Đăng nhập bằng Google thất bại. Vui lòng thử lại!"));
    },
  });
};

// ─── Đăng ký (bước 1 - gửi OTP) ─────────────────────────────────────────────────
export const useRegister = () => {
  return useMutation({
    mutationFn: (data: RegisterPayload) => authService.register(data),
    onError: (error: any) => {
      notifyError(extractErrorMessage(error, "Đăng ký thất bại. Vui lòng thử lại!"));
    },
  });
};

export const useSignup = useRegister;

// ─── Xác thực OTP đăng ký ───────────────────────────────────────────────────────
export const useVerifyOtp = () => {
  return useMutation({
    mutationFn: (data: { email: string; otp: string }) => authService.verifyOtp(data),
    onError: (error: any) => {
      notifyError(extractErrorMessage(error, "Mã OTP không đúng hoặc đã hết hạn."));
    },
  });
};

// ─── Gửi lại OTP đăng ký ────────────────────────────────────────────────────────
export const useResendOtp = () => {
  return useMutation({
    mutationFn: (email: string) => authService.resendOtp(email),
    onError: (error: any) => {
      notifyError(extractErrorMessage(error, "Không thể gửi lại mã OTP lúc này."));
    },
  });
};

// ─── Lấy thông tin user hiện tại ─────────────────────────────────────────────────
// GET /profile/me (KHÔNG phải /auth/me - route này không tồn tại trên backend).
export const useCurrentUser = () => {
  return useQuery<User>({
    queryKey: CURRENT_USER_KEY,
    queryFn: async () => {
      const res: any = await profileService.me();
      return res?.data ?? res;
    },
    enabled: !!Cookies.get("token"),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
};

// ─── Đăng xuất ────────────────────────────────────────────────────────────────
export const useLogout = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  return () => {
    // POST /auth/token/logout (route cũ /auth/logout không tồn tại trên backend)
    authService.logout().catch(() => {});

    Cookies.remove("token");
    Cookies.remove("user");
    useAuthStore.getState().clearAuth();

    queryClient.setQueryData(CURRENT_USER_KEY, null);
    queryClient.invalidateQueries({ queryKey: CURRENT_USER_KEY });

    notifySuccess("Đã đăng xuất thành công.");
    router.push("/login");
  };
};

// ─── Quên mật khẩu (gửi OTP) ────────────────────────────────────────────────────
export const useForgotPassword = () => {
  return useMutation({
    mutationFn: (email: string) => authService.forgotPassword(email),
    onError: (error: any) => {
      notifyError(
        extractErrorMessage(error, "Không thể gửi yêu cầu đặt lại mật khẩu. Vui lòng kiểm tra lại địa chỉ email.")
      );
    },
  });
};

// ─── Đặt lại mật khẩu ─────────────────────────────────────────────────────────
// LƯU Ý: backend dùng luồng OTP (email + otp + newPassword) - xem ResetPasswordRequest.java,
// KHÔNG phải link kèm token như reset-password/page.tsx hiện đang code. Giữ tạm chữ ký cũ
// (token, newPassword) để không phá build của page đó ở Đợt 1 - sẽ nối lại đúng luồng OTP
// (thêm ô nhập OTP, bỏ đọc ?token từ URL) khi làm tới Đợt 5 theo đúng thứ tự đã chốt.
export const useResetPassword = () => {
  const router = useRouter();

  return useMutation({
    mutationFn: async (_payload: { token: string; newPassword: string }): Promise<ApiResponse<null>> => {
      throw {
        response: {
          data: {
            message: "Luồng đặt lại mật khẩu qua OTP sẽ được hoàn thiện ở Đợt 5, vui lòng quay lại sau.",
          },
        },
      };
    },
    onSuccess: () => {
      notifySuccess("Đặt lại mật khẩu thành công! Vui lòng đăng nhập.");
      router.push("/login");
    },
    onError: (error: any) => {
      notifyError(extractErrorMessage(error, "Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn."));
    },
  });
};
