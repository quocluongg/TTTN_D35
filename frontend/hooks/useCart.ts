import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cartService } from "@/services/cartService";
import { notifySuccess, notifyError } from "@/components/Notify";

export const CART_QUERY_KEY = ["cart"];

export const useCart = () => {
  const queryClient = useQueryClient();

  const cartQuery = useQuery({
    queryKey: CART_QUERY_KEY,
    queryFn: () => cartService.getCart(),
    staleTime: 1000 * 60 * 5, // 5 mins
  });

  const addToCartMutation = useMutation({
    mutationFn: ({ variantId, quantity }: { variantId: string; quantity: number }) =>
      cartService.addItem({ variantId, quantity }),
    onSuccess: (res: any) => {
      queryClient.setQueryData(CART_QUERY_KEY, res);
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
      notifySuccess("Đã thêm sản phẩm vào giỏ hàng!");
    },
    onError: (err: any) => {
      notifyError(err?.response?.data?.message || err?.message || "Không thể thêm vào giỏ hàng!");
    },
  });

  const updateQuantityMutation = useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) =>
      cartService.updateItem(id, { quantity }),
    onSuccess: (res: any) => {
      queryClient.setQueryData(CART_QUERY_KEY, res);
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
    },
    onError: (err: any) => {
      notifyError(err?.response?.data?.message || err?.message || "Không thể cập nhật số lượng!");
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: (id: string) => cartService.removeItem(id),
    onSuccess: (res: any) => {
      queryClient.setQueryData(CART_QUERY_KEY, res);
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
      notifySuccess("Đã xóa sản phẩm khỏi giỏ hàng!");
    },
    onError: (err: any) => {
      notifyError(err?.response?.data?.message || err?.message || "Không thể xóa sản phẩm!");
    },
  });

  const clearCartMutation = useMutation({
    mutationFn: () => cartService.clear(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
      notifySuccess("Đã làm trống giỏ hàng!");
    },
  });

  const rawCartData: any = (cartQuery.data as any)?.data ?? cartQuery.data;
  const items: any[] = rawCartData?.items || [];
  const totalItems = items.reduce((sum: number, item: any) => sum + Number(item.quantity || 0), 0);
  const totalPrice = items.reduce(
    (sum: number, item: any) =>
      sum + Number(item.subtotal || (Number(item.salePrice ?? item.price ?? 0) * Number(item.quantity || 0))),
    0
  );

  return {
    cartData: rawCartData,
    items,
    totalItems,
    totalPrice,
    isLoading: cartQuery.isLoading,
    isError: cartQuery.isError,
    refetchCart: cartQuery.refetch,
    addToCart: addToCartMutation.mutate,
    isAddingToCart: addToCartMutation.isPending,
    updateQuantity: updateQuantityMutation.mutate,
    isUpdatingQuantity: updateQuantityMutation.isPending,
    removeItem: removeItemMutation.mutate,
    isRemovingItem: removeItemMutation.isPending,
    clearCart: clearCartMutation.mutate,
    isClearingCart: clearCartMutation.isPending,
  };
};
