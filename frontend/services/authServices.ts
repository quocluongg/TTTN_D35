import http from "@/lib/http";

// --- Interfaces ---

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  role: "CUSTOMER" | "ADMIN" | "EMPLOYEE" | "user" | "admin";
  emailVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/** Wrapper ApiResponse<T> mà backend Spring Boot trả về */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp?: string;
}

/** Payload token sau khi đăng nhập thành công */
export interface TokenResponse {
  accessToken: string;
  tokenType: string;
  user: User;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
}

// --- Auth Service ---

export const authService = {
  /**
   * POST /auth/login
   * http interceptor unwraps axios response.data →
   * service nhận ApiResponse<TokenResponse>
   */
  login: async (data: LoginPayload): Promise<ApiResponse<TokenResponse>> => {
    return http.post("/auth/login", data);
  },

  /**
   * POST /auth/register
   */
  register: async (data: RegisterPayload): Promise<ApiResponse<User>> => {
    return http.post("/auth/register", data);
  },

  /**
   * GET /auth/me — lấy thông tin user hiện tại
   */
  getMe: async (): Promise<User> => {
    const response: ApiResponse<User> = await http.get("/auth/me");
    return response?.data || (response as unknown as User);
  },

  /**
   * POST /auth/logout — gọi backend để invalidate refresh token
   */
  logout: async (): Promise<void> => {
    try {
      await http.post("/auth/logout");
    } catch {
      // Bỏ qua lỗi logout phía server nếu token đã hết hạn
    }
  },

  /**
   * POST /auth/forgot-password — gửi email reset link
   */
  forgotPassword: async (email: string): Promise<ApiResponse<null>> => {
    return http.post("/auth/forgot-password", { email });
  },

  /**
   * POST /auth/reset-password — đặt mật khẩu mới với token từ email
   */
  resetPassword: async (
    token: string,
    newPassword: string
  ): Promise<ApiResponse<null>> => {
    return http.post("/auth/reset-password", { token, newPassword });
  },
};
