import http from "@/lib/http";

export interface User {
  _id: string;
  fullName: string;
  email: string;
  role: "admin" | "user";
  avatar?: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export const authService = {
  login: async (data: any) => {
    return http.post("/auth/login", data) as Promise<AuthResponse>;
  },

  register: async (data: any) => {
    return http.post("/auth/register", data);
  },

  getMe: async (): Promise<User> => {
    return http.get("/auth/me") as unknown as User;
  },
};
