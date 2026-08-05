import http from "@/lib/http";
export const voucherService = { validate: (data: { code: string; orderAmount: number }) => http.post("/vouchers/validate", data) };
