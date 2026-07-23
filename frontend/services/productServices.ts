import http from "@/lib/http";
import { ApiResponse } from "./authServices";

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice: number | null;
  discountBadge: string | null;
  statusBadge: string | null;
  imageUrl: string;
  rating: number;
  reviewsCount: number;
  useCase: string;
  isFeatured: boolean;
  description: string;
}

export interface GetProductsParams {
  category?: string;
  use_case?: string[];
  max_price?: number;
  sort_by?: string;
}

export const productService = {
  getProducts: async (params?: GetProductsParams): Promise<ApiResponse<Product[]>> => {
    const queryParams: any = {};
    if (params) {
      if (params.category && params.category !== "Tất cả") {
        queryParams.category = params.category;
      }
      if (params.use_case && params.use_case.length > 0) {
        queryParams.use_case = params.use_case.join(",");
      }
      if (params.max_price !== undefined) {
        queryParams.max_price = params.max_price;
      }
      if (params.sort_by) {
        queryParams.sort_by = params.sort_by;
      }
    }
    return http.get("/products", { params: queryParams });
  },

  getCategories: async (): Promise<ApiResponse<string[]>> => {
    return http.get("/categories");
  }
};
