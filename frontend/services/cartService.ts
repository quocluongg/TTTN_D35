import http from "@/lib/http";
export const cartService = { getCart: () => http.get("/cart"), addItem: (data: unknown) => http.post("/cart/items", data), updateItem: (id: string, data: unknown) => http.put(`/cart/items/${id}`, data), removeItem: (id: string) => http.delete(`/cart/items/${id}`), clear: () => http.delete("/cart") };
