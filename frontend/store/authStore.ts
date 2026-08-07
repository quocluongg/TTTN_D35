"use client";

import { create } from "zustand";

// Chỉ giữ accessToken trong store (in-memory, mất khi F5 - đã có fallback đọc cookie "token"
// trong lib/http.ts). Thông tin user (fullName/email/role/avatar...) KHÔNG lưu ở đây vì backend
// không trả kèm lúc login - lấy qua React Query (useCurrentUser -> GET /profile/me) để luôn đồng bộ
// với dữ liệu mới nhất, tránh cache lệch khi user đổi tên/avatar ở trang Account.
type AuthState = {
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (accessToken: string) => void;
  clearAuth: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  isAuthenticated: false,
  setAuth: (accessToken) => set({ accessToken, isAuthenticated: true }),
  clearAuth: () => set({ accessToken: null, isAuthenticated: false }),
}));
