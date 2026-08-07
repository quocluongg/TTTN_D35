import http from "@/lib/http";
export const campaignService = { list: () => http.get("/campaigns") };
