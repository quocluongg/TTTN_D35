import http from "@/lib/http";
import type { Query } from "./apiTypes";
export const newsService = { list: (params?: Query) => http.get("/news", { params }), get: (slug: string) => http.get(`/news/${slug}`), recent: (limit?: number) => http.get("/news/recent", { params: { limit } }) };
