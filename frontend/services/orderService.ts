import http from "@/lib/http";
import type { Query } from "./apiTypes";
export const orderService = { create: (data: unknown) => http.post("/orders", data), createGuest: (data: unknown) => http.post("/orders/guest", data), list: (params?: Query) => http.get("/orders", { params }), get: (id: string) => http.get(`/orders/${id}`), cancel: (id: string) => http.patch(`/orders/${id}/cancel`) };
