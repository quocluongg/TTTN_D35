import http from "@/lib/http";
export const systemConfigService = { public: () => http.get("/system-configs/public") };
