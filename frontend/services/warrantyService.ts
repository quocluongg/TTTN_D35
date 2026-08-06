import http from "@/lib/http";
export const warrantyService = { lookup: (serial: string) => http.get("/warranty/lookup", { params: { serial } }) };
