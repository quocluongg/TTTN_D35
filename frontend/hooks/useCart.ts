"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Cookies from "js-cookie";
import { cartService } from "@/services/cartService";
import type { ApiResponse } from "@/services/apiTypes";
import { notifyError } from "@/components/Notify";

export const CART_KEY = ["cart"];

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  variantId: string;
  variantName?: string;
  attributes?: Record<string, string>;
  image?: string;
  price: number;
  salePrice?: number | null;
  vatPercent?: number;
  quantity: number;
  subtotal: number;
  availableStock: number;
}

export interface Cart {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
}

function extractErrorMessage(error: any, fallback: string): string {
  return error?.response?.data?.message || error?.message || fallback;
}

// GET /cart - chỉ bật khi có token, tránh gọi API thừa cho khách chưa đăng nhập.
export const useCartQuery = () => {
  return useQuery<Cart>({
    queryKey: CART_KEY,
    queryFn: async () => {
      const res: ApiResponse<Cart> = (await cartService.getCart()) as any;
      return res?.data ?? { items: [], totalItems: 0, subtotal: 0 };
    },
    enabled: !!Cookies.get("token"),
    staleTime: 30 * 1000,
  });
};

// Dùng cho Navbar/nơi chỉ cần số lượng, không cần subscribe toàn bộ list item.
export const useCartCount = () => {
  const { data } = useCartQuery();
  return data?.totalItems ?? 0;
};

export const useAddToCart = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { variantId: string; quantity: number }) => cartService.addItem(data),
    onSuccess: (res: any) => {
      queryClient.setQueryData(CART_KEY, res?.data);
    },
    onError: (error: any) => {
      notifyError(extractErrorMessage(error, "Không thể thêm vào giỏ hàng."));
    },
  });
};

export const useUpdateCartQuantity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) =>
      cartService.updateItem(id, { quantity }),
    onSuccess: (res: any) => {
      queryClient.setQueryData(CART_KEY, res?.data);
    },
    onError: (error: any) => {
      notifyError(extractErrorMessage(error, "Không thể cập nhật số lượng."));
      // Rollback: dữ liệu server mới nhất luôn đúng, refetch lại để UI trở về giá trị thật.
      queryClient.invalidateQueries({ queryKey: CART_KEY });
    },
  });
};

export const useRemoveCartItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cartService.removeItem(id),
    onSuccess: (res: any) => {
      queryClient.setQueryData(CART_KEY, res?.data);
    },
    onError: (error: any) => {
      notifyError(extractErrorMessage(error, "Không thể xóa sản phẩm khỏi giỏ hàng."));
    },
  });
};

export const useClearCart = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => cartService.clear(),
    onSuccess: () => {
      queryClient.setQueryData(CART_KEY, { items: [], totalItems: 0, subtotal: 0 });
    },
    onError: (error: any) => {
      notifyError(extractErrorMessage(error, "Không thể xóa giỏ hàng."));
    },
  });
};
