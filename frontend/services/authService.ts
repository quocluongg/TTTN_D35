import http from "@/lib/http";
import type { ApiResponse } from "./apiTypes";
export * from "./authServices";
export const authServiceV2 = {
  register: (data: Record<string, unknown>) => http.post<ApiResponse<unknown>>("/auth/register", data),
  verifyOtp: (data: { email: string; otp: string }) => http.post("/auth/verify-otp", data),
  resendOtp: (email: string) => http.post("/auth/resend-otp", { email }),
  login: (data: { email: string; password: string }) => http.post("/auth/login", data),
  googleLogin: (idToken: string) => http.post("/auth/google-login", { idToken }),
  forgotPassword: (email: string) => http.post("/auth/forgot-password", { email }),
  resetPassword: (data: { email: string; otp: string; newPassword: string }) => http.post("/auth/reset-password", data),
  refresh: () => http.post("/auth/token/refresh"),
  logout: () => http.post("/auth/token/logout"),
};
