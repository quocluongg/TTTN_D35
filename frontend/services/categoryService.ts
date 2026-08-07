import http from "@/lib/http";
export const categoryService = { list: () => http.get("/categories"), breadcrumb: (slug: string) => http.get(`/categories/${slug}/breadcrumb`) };
