import http from "@/lib/http";
import type { ApiResponse } from "./apiTypes";

// ===== Types khớp DTO thật của backend (AuthController + ProfileResponse) =====
// Lưu ý quan trọng: backend KHÔNG trả field `user` kèm theo TokenResponse lúc login
// Muốn lấy thông tin user ọi GET /profile/me (profileService.me()) sau khi có accessToken.

export interface User {
  id: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  avatarUrl?: string;
  role: string;
  emailVerified: boolean;
  emailNotif?: boolean;
  pushNotif?: boolean;
  systemNotif?: boolean;
}

export interface TokenResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  // refreshToken nằm trong HttpOnly cookie "refresh_token" (path /auth/token), backend không trả trong body.
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  fullName: string;
}

export interface VerifyOtpPayload {
  email: string;
  otp: string;
}

export interface ResetPasswordPayload {
  email: string;
  otp: string;
  newPassword: string;
}

// ===== Auth Service - map đúng từng route của AuthController =====
export const authService = {
  /** POST /auth/register - không trả data, chỉ trả message thông báo đã gửi OTP */
  register: (data: RegisterPayload): Promise<ApiResponse<null>> => http.post("/auth/register", data),

  /** POST /auth/verify-otp - xác thực email sau khi đăng ký */
  verifyOtp: (data: VerifyOtpPayload): Promise<ApiResponse<null>> => http.post("/auth/verify-otp", data),

  /** POST /auth/resend-otp */
  resendOtp: (email: string): Promise<ApiResponse<null>> => http.post("/auth/resend-otp", { email }),

  /** POST /auth/login */
  login: (data: LoginPayload): Promise<ApiResponse<TokenResponse>> => http.post("/auth/login", data),

  /** POST /auth/google-login - idToken lấy từ Google Identity Services phía client */
  googleLogin: (idToken: string): Promise<ApiResponse<TokenResponse>> =>
    http.post("/auth/google-login", { idToken }),

  /** POST /auth/forgot-password - gửi OTP để đặt lại mật khẩu (không phải link email) */
  forgotPassword: (email: string): Promise<ApiResponse<null>> => http.post("/auth/forgot-password", { email }),

  /**
   * POST /auth/reset-password - cần email + otp + newPassword (luồng OTP 2 bước).
   * reset-password/page.tsx hiện tại còn code theo flow "link kèm token" cũ, chưa khớp - sẽ nối lại
   * đúng luồng OTP khi làm tới Đợt 5 theo đúng thứ tự đã chốt, không đụng vào page đó ở Đợt 1 này.
   */
  resetPassword: (data: ResetPasswordPayload): Promise<ApiResponse<null>> =>
    http.post("/auth/reset-password", data),

  /** POST /auth/token/refresh - refresh token đọc từ HttpOnly cookie, không cần truyền tay */
  refreshToken: (): Promise<ApiResponse<TokenResponse>> => http.post("/auth/token/refresh"),

  /** POST /auth/token/logout (KHÔNG phải /auth/logout - route cũ sai) */
  logout: (): Promise<ApiResponse<null>> => http.post("/auth/token/logout"),
};
