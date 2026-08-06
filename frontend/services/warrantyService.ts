import http from "@/lib/http";

export const warrantyService = {
  lookup: (phone: string, serial: string) =>
    http.get("/warranty/lookup", { params: { phone, serial } }),
};
