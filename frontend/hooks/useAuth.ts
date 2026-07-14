"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { authService } from "@/services/authServices";
import { notifyError, notifySuccess } from "@/components/Notify";

const CURRENT_USER_KEY = ["currentUser"];

// login hook
export const useLogin = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authService.login,
    onSuccess: (data: any) => {
      if (data?.token) {
        // save token
        Cookies.set("token", data.token, {
          expires: 7,
        });

        // save basic info
        Cookies.set(
          "user",
          JSON.stringify({
            name: data.fullName || data.user?.fullName,
            role: data.role || data.user?.role,
            avatar: data.avatar || data.user?.avatar,
          }),
          { expires: 7 }
        );
      }

      // refresh cache
      queryClient.invalidateQueries({ queryKey: CURRENT_USER_KEY });

      notifySuccess("Login successful.");

      // redirect by role
      if (data?.role === "admin" || data?.user?.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/");
      }
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || "Invalid email or password.";
      notifyError(message);
    },
  });
};

// register hook
export const useRegister = () => {
  const router = useRouter();
  return useMutation({
    mutationFn: authService.register,
    onSuccess: () => {
      notifySuccess("Registration successful! Please login.");
      router.push("/login");
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || "Registration failed.";
      notifyError(message);
    },
  });
};

// get current user hook
export const useCurrentUser = () => {
  return useQuery({
    queryKey: CURRENT_USER_KEY,
    queryFn: authService.getMe,
    // fetch only if token exists
    enabled: !!Cookies.get("token"),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
};

// logout hook
export const useLogout = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  return () => {
    // remove cookies
    Cookies.remove("token");
    Cookies.remove("user");

    // clear cache
    queryClient.setQueryData(CURRENT_USER_KEY, null);
    queryClient.invalidateQueries({ queryKey: CURRENT_USER_KEY });

    notifySuccess("Logged out successfully.");
    router.push("/login");
  };
};
