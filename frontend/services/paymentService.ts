import http from "@/lib/http";
import type { Query } from "./apiTypes";
export const paymentService = { init: (orderId: string, data?: unknown) => http.post(`/payments/${orderId}/init`, data), vnpayReturn: (params: Query) => http.get("/payments/vnpay/return", { params }) };
