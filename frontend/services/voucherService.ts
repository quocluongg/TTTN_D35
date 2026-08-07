import http from "@/lib/http";
export const voucherService = { validate: (data: { code: string; eligibleAmount: number }) => http.post("/vouchers/validate", data) };
