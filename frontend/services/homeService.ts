import http from "@/lib/http";
export const homeService = { banners: () => http.get("/home/banners"), brands: () => http.get("/home/brands"), featuredCategories: () => http.get("/home/featured-categories") };
