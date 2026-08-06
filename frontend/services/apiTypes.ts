export interface ApiResponse<T> { success: boolean; message?: string; data: T; timestamp?: string }
export interface PageResponse<T> { content: T[]; page: number; size: number; totalElements: number; totalPages: number; last: boolean }
export type Query = Record<string, string | number | boolean | undefined | null>;
