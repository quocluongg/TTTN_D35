import http from "@/lib/http";

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  timestamp: string;
}

export interface PageResponse<T> {
  items?: T[];
  content?: T[];
  pagination?: {
    currentPage: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
  };
  page?: number;
  size?: number;
  totalElements?: number;
  totalPages?: number;
  last?: boolean;
}

export interface ProductListItem {
  id: string;
  slug: string;
  name: string;
  thumbnail: string;
  brand: string;
  categoryName: string;
  priceFrom: number;
  ratingAvg: number;
  reviewCount: number;
  active?: boolean;
  isActive?: boolean;
}

export interface CategoryTree {
  id: string;
  name: string;
  slug: string;
  description?: string;
  children?: CategoryTree[];
}

export interface GetProductsParams {
  categorySlug?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  specKey?: string;
  specValue?: string;
  sortBy?: string;
  page?: number;
  size?: number;
}

export interface ProductVariant {
  id: string;
  sku: string;
  variantName: string;
  price: number;
  stock: number;
  attributes?: Record<string, string>;
  vatPercent?: number;
  image?: string;
}

export interface ProductImage {
  id: string;
  url: string;
  sortOrder: number;
}

export interface CustomTab {
  id: string;
  title: string;
  content: string;
  sortOrder: number;
}

export interface CategoryBreadcrumb {
  id: string;
  name: string;
  slug: string;
}

export interface ProductDetail {
  id: string;
  slug: string;
  name: string;
  description: string;
  brand: string;
  origin?: string;
  thumbnail?: string;
  warrantyMonths?: number;
  ratingAvg?: number;
  reviewCount?: number;
  active?: boolean;
  isActive?: boolean;
  customTabs?: CustomTab[];
  categoryBreadcrumb?: CategoryBreadcrumb[];
  variants?: ProductVariant[];
  images?: ProductImage[];
}

export const productService = {
  getProducts: async (params?: GetProductsParams): Promise<ApiResponse<PageResponse<ProductListItem>>> => {
    const queryParams: Record<string, any> = {};
    if (params) {
      if (params.categorySlug && params.categorySlug !== "Tất cả") {
        queryParams.categorySlug = params.categorySlug;
      }
      if (params.brand) queryParams.brand = params.brand;
      if (params.minPrice !== undefined) queryParams.minPrice = params.minPrice;
      if (params.maxPrice !== undefined) queryParams.maxPrice = params.maxPrice;
      if (params.search) queryParams.search = params.search;
      if (params.specKey) queryParams.specKey = params.specKey;
      if (params.specValue) queryParams.specValue = params.specValue;
      if (params.sortBy) queryParams.sortBy = params.sortBy;
      if (params.page !== undefined) queryParams.page = params.page;
      if (params.size !== undefined) queryParams.size = params.size;
    }
    return http.get("/products", { params: queryParams });
  },

  getProductBySlugOrId: async (slugOrId: string): Promise<ApiResponse<ProductDetail>> => {
    return http.get(`/products/${slugOrId}`);
  },

  getCategories: async (): Promise<ApiResponse<CategoryTree[]>> => {
    return http.get("/categories");
  }
};
