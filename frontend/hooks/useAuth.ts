"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { authService, ApiResponse, TokenResponse, User } from "@/services/authServices";
import { notifyError, notifySuccess } from "@/components/Notify";

export const CURRENT_USER_KEY = ["currentUser"];

// ─── Đăng nhập ────────────────────────────────────────────────────────────────
export const useLogin = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authService.login,
    onSuccess: (response: ApiResponse<TokenResponse>) => {
      // http interceptor đã unwrap axios.response.data
      // nên `response` ở đây là ApiResponse<TokenResponse>
      const tokenData = response?.data;

      if (tokenData?.accessToken) {
        Cookies.set("token", tokenData.accessToken, { expires: 7 });
      }

      if (tokenData?.user) {
        Cookies.set(
          "user",
          JSON.stringify({
            name: tokenData.user.fullName,
            email: tokenData.user.email,
            role: tokenData.user.role,
            avatar: tokenData.user.avatarUrl,
          }),
          { expires: 7 }
        );
      }

      queryClient.invalidateQueries({ queryKey: CURRENT_USER_KEY });
      notifySuccess("Đăng nhập thành công!");

      const role = tokenData?.user?.role;
      if (role === "ADMIN" || role === "admin") {
        router.push("/admin");
      } else {
        router.push("/");
      }
    },
    onError: (error: any) => {
      const message =
        error?.message ||
        error?.response?.data?.message ||
        "Email hoặc mật khẩu không đúng. Vui lòng thử lại!";
      notifyError(message);
    },
  });
};

// ─── Đăng ký ──────────────────────────────────────────────────────────────────
export const useRegister = () => {
  const router = useRouter();

  return useMutation({
    mutationFn: authService.register,
    onSuccess: () => {
      notifySuccess("Đăng ký thành công! Vui lòng đăng nhập.");
      router.push("/login");
    },
    onError: (error: any) => {
      const message =
        error?.message ||
        error?.response?.data?.message ||
        "Đăng ký thất bại. Vui lòng thử lại!";
      notifyError(message);
    },
  });
};

export const useSignup = useRegister;

// ─── Lấy thông tin user hiện tại ──────────────────────────────────────────────
export const useCurrentUser = () => {
  return useQuery<User>({
    queryKey: CURRENT_USER_KEY,
    queryFn: authService.getMe,
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
    // Gọi backend logout (fire-and-forget)
    authService.logout().catch(() => {});

    Cookies.remove("token");
    Cookies.remove("user");

    queryClient.setQueryData(CURRENT_USER_KEY, null);
    queryClient.invalidateQueries({ queryKey: CURRENT_USER_KEY });

    notifySuccess("Đã đăng xuất thành công.");
    router.push("/login");
  };
};

// ─── Quên mật khẩu ────────────────────────────────────────────────────────────
export const useForgotPassword = () => {
  return useMutation({
    mutationFn: (email: string) => authService.forgotPassword(email),
    onError: (error: any) => {
      const message =
        error?.message ||
        error?.response?.data?.message ||
        "Không thể gửi email. Vui lòng kiểm tra lại địa chỉ email.";
      notifyError(message);
    },
  });
};

// ─── Đặt lại mật khẩu ─────────────────────────────────────────────────────────
export const useResetPassword = () => {
  const router = useRouter();

  return useMutation({
    mutationFn: ({ token, newPassword }: { token: string; newPassword: string }) =>
      authService.resetPassword(token, newPassword),
    onSuccess: () => {
      notifySuccess("Đặt lại mật khẩu thành công! Vui lòng đăng nhập.");
      router.push("/login");
    },
    onError: (error: any) => {
      const message =
        error?.message ||
        error?.response?.data?.message ||
        "Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.";
      notifyError(message);
    },
  });
};
