"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface CartItem {
  variantId: string;
  productId: string;
  name: string;
  sku?: string;
  variantName?: string;
  price: number;
  quantity: number;
  image: string;
}

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (newItem) => {
        const currentItems = get().items;
        const existingIndex = currentItems.findIndex((i) => i.variantId === newItem.variantId);

        if (existingIndex > -1) {
          const updatedItems = [...currentItems];
          updatedItems[existingIndex].quantity += newItem.quantity || 1;
          set({ items: updatedItems });
        } else {
          set({ items: [...currentItems, { ...newItem, quantity: newItem.quantity || 1 }] });
        }
      },
      removeItem: (variantId) => {
        set({ items: get().items.filter((item) => item.variantId !== variantId) });
      },
      updateQuantity: (variantId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(variantId);
          return;
        }
        set({
          items: get().items.map((item) =>
            item.variantId === variantId ? { ...item, quantity } : item
          ),
        });
      },
      clearCart: () => set({ items: [] }),
      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },
      getTotalPrice: () => {
        return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
      },
    }),
    {
      name: "shopwise_cart_storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
