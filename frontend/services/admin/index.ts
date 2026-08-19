import http from "@/lib/http";
import type { Query } from "../apiTypes";
const crud = (path: string) => ({
  list: (params?: Query) => http.get(path, { params }),
  get: (id: string) => http.get(`${path}/${id}`),
  create: (data: unknown) => http.post(path, data),
  update: (id: string, data: unknown) => http.put(`${path}/${id}`, data),
  delete: (id: string) => http.delete(`${path}/${id}`),
});
export const adminApi = {
  products: { list: (params?: Query) => http.get("/admin/products", { params }), get: (id: string) => http.get(`/admin/products/${id}`), create: (data: unknown) => http.post("/admin/products", data), update: (id: string, data: unknown) => http.put(`/admin/products/${id}`, data), status: (id: string, data: unknown) => http.patch(`/admin/products/${id}/status`, data), uploadImage: (id: string, data: FormData) => http.post(`/admin/products/${id}/images`, data, { headers: { "Content-Type": "multipart/form-data" } }), deleteImage: (id: string, imageId: string) => http.delete(`/admin/products/${id}/images/${imageId}`), addVariant: (id: string, data: unknown) => http.post(`/admin/products/${id}/variants`, data), updateVariant: (id: string, variantId: string, data: unknown) => http.put(`/admin/products/${id}/variants/${variantId}`, data), deleteVariant: (id: string, variantId: string) => http.delete(`/admin/products/${id}/variants/${variantId}`), getSpecifications: (id: string) => http.get(`/admin/products/${id}/specifications`), updateSpecifications: (id: string, data: unknown) => http.put(`/admin/products/${id}/specifications`, data) },
  attributeKeys: { list: () => http.get("/admin/product-attribute-keys"), create: (data: unknown) => http.post("/admin/product-attribute-keys", data), update: (id: number, data: unknown) => http.put(`/admin/product-attribute-keys/${id}`, data), delete: (id: number) => http.delete(`/admin/product-attribute-keys/${id}`) },
  categories: { list: (params?: Query) => http.get("/admin/categories", { params }), create: (data: unknown) => http.post("/admin/categories", data), update: (id: string, data: unknown) => http.put(`/admin/categories/${id}`, data), delete: (id: string) => http.delete(`/admin/categories/${id}`) },
  campaigns: { list: () => http.get("/admin/campaigns"), create: (data: unknown) => http.post("/admin/campaigns", data), update: (id: string, data: unknown) => http.put(`/admin/campaigns/${id}`, data), status: (id: string, data: unknown) => http.patch(`/admin/campaigns/${id}/status`, data), items: (id: string) => http.get(`/admin/campaigns/${id}/items`), addItem: (id: string, data: unknown) => http.post(`/admin/campaigns/${id}/items`, data), updateItem: (id: string, itemId: string, data: unknown) => http.put(`/admin/campaigns/${id}/items/${itemId}`, data), deleteItem: (id: string, itemId: string) => http.delete(`/admin/campaigns/${id}/items/${itemId}`) },
  vouchers: { list: (params?: Query) => http.get("/admin/vouchers", { params }), create: (data: unknown) => http.post("/admin/vouchers", data), update: (id: string, data: unknown) => http.put(`/admin/vouchers/${id}`, data), status: (id: string, data: unknown) => http.patch(`/admin/vouchers/${id}/status`, data) },
  orders: { list: (params?: Query) => http.get("/admin/orders", { params }), get: (id: string) => http.get(`/admin/orders/${id}`), status: (id: string, data: unknown) => http.patch(`/admin/orders/${id}/status`, data) },
  users: { list: (params?: Query) => http.get("/admin/users", { params }), get: (id: string) => http.get(`/admin/users/${id}`), create: (data: unknown) => http.post("/admin/users", data), update: (id: string, data: unknown) => http.patch(`/admin/users/${id}`, data), lock: (id: string, data?: unknown) => http.patch(`/admin/users/${id}/lock`, data) },
  roles: { list: () => http.get("/admin/roles"), get: (id: string) => http.get(`/admin/roles/${id}`), permissions: () => http.get("/admin/roles/permissions"), updatePermissions: (id: string, data: unknown) => http.put(`/admin/roles/${id}/permissions`, data) },
  inventory: { list: (params?: Query) => http.get("/admin/inventory", { params }), updateStock: (id: string, data: unknown) => http.patch(`/admin/inventory/variants/${id}/stock`, data), history: (id: string) => http.get(`/admin/inventory/variants/${id}/history`) },
  news: { list: (params?: Query) => http.get("/admin/news", { params }), create: (data: unknown) => http.post("/admin/news", data), update: (id: string, data: unknown) => http.put(`/admin/news/${id}`, data), delete: (id: string) => http.delete(`/admin/news/${id}`), status: (id: string, data: unknown) => http.patch(`/admin/news/${id}/status`, data) },
  warranty: { list: (params?: Query) => http.get("/admin/warranty", { params }), create: (data: unknown) => http.post("/admin/warranty", data), get: (id: string) => http.get(`/admin/warranty/${id}`), status: (id: string, data: unknown) => http.patch(`/admin/warranty/${id}/status`, data), addHistory: (id: string, data: unknown) => http.post(`/admin/warranty/${id}/histories`, data), updateHistory: (cardId: string, historyId: string, data: unknown) => http.patch(`/admin/warranty/${cardId}/histories/${historyId}`, data) },
  reports: { revenue: (params?: Query) => http.get("/admin/reports/revenue", { params }), topProducts: (params?: Query) => http.get("/admin/reports/top-products", { params }), topCustomers: (params?: Query) => http.get("/admin/reports/top-customers", { params }), orderStatus: (params?: Query) => http.get("/admin/reports/order-status-summary", { params }), lowStock: (params?: Query) => http.get("/admin/reports/inventory-low-stock", { params }) },
  auditLogs: (params?: Query) => http.get("/admin/audit-logs", { params }),
  home: {
    layout: {
      list: () => http.get("/admin/home/layout"),
      create: (data: unknown) => http.post("/admin/home/layout", data),
      update: (id: string, data: unknown) => http.put(`/admin/home/layout/${id}`, data),
      reorder: (data: unknown) => http.put("/admin/home/layout/reorder", data),
      delete: (id: string) => http.delete(`/admin/home/layout/${id}`),
    },
    banners: crud("/admin/home/banners"),
    brands: crud("/admin/home/brands"),
    featuredCategories: crud("/admin/home/featured-categories"),
    addFeaturedItem: (id: string, data: unknown) => http.post(`/admin/home/featured-categories/${id}/items`, data),
    deleteFeaturedItem: (itemId: string) => http.delete(`/admin/home/featured-categories/items/${itemId}`),
  },
  systemConfigs: { list: () => http.get("/admin/system-configs"), get: (key: string) => http.get(`/admin/system-configs/${key}`), update: (key: string, data: unknown) => http.put(`/admin/system-configs/${key}`, data) },
};
