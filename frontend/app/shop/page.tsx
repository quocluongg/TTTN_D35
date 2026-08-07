"use client";

import React, { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import PublicLayout from "@/shared/layouts/PublicLayout";
import { ChevronDown, X, SlidersHorizontal, Cpu, HardDrive, Star } from "lucide-react";
import { productService, ProductListItem, CategoryTree } from "@/services/productServices";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface CategoryItem {
  name: string;
  slug: string;
}

function ShopContent() {
  const searchParams = useSearchParams();
  const initialCategorySlug = searchParams.get("category") || "";
  const initialBrand = searchParams.get("brand") || "";
  const initialSearch = searchParams.get("search") || "";

  // State Management
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>(initialCategorySlug);
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>("Tất cả sản phẩm");
  const [selectedBrand, setSelectedBrand] = useState<string>(initialBrand);
  const [sortBy, setSortBy] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<number>(100000000);
  const [searchQuery, setSearchQuery] = useState<string>(initialSearch);

  // EAV Spec Filter States
  const [selectedRam, setSelectedRam] = useState<string>("");
  const [selectedCpu, setSelectedCpu] = useState<string>("");

  // Pagination & State
  const [page, setPage] = useState<number>(0);

  // Sync params from URL changes
  useEffect(() => {
    setSearchQuery(searchParams.get("search") || "");
    const cat = searchParams.get("category") || "";
    if (cat !== selectedCategorySlug) setSelectedCategorySlug(cat);
    const brd = searchParams.get("brand") || "";
    if (brd !== selectedBrand) setSelectedBrand(brd);
  }, [searchParams]);

  // Query: Categories Tree
  const { data: categoriesData } = useQuery({
    queryKey: ["categories-tree"],
    queryFn: async () => {
      const res = await productService.getCategories();
      const flatCategories: CategoryItem[] = [{ name: "Tất cả", slug: "" }];
      if (res.success && res.data) {
        const extractCategories = (tree: CategoryTree[]) => {
          tree.forEach((c) => {
            flatCategories.push({ name: c.name, slug: c.slug });
            if (c.children && c.children.length > 0) {
              extractCategories(c.children);
            }
          });
        };
        extractCategories(res.data);
      }
      return flatCategories;
    },
    staleTime: 5 * 60 * 1000,
  });

  const categories = categoriesData || [{ name: "Tất cả", slug: "" }];

  // Determine specKey & specValue for EAV filtering
  let specKey: string | undefined = undefined;
  let specValue: string | undefined = undefined;
  if (selectedRam) {
    specKey = "RAM";
    specValue = selectedRam;
  } else if (selectedCpu) {
    specKey = "CPU";
    specValue = selectedCpu;
  }

  // Query: Products List via TanStack Query
  const { data: productsRes, isLoading: loading } = useQuery({
    queryKey: [
      "products",
      selectedCategorySlug,
      selectedBrand,
      maxPrice,
      sortBy,
      searchQuery,
      specKey,
      specValue,
      page,
    ],
    queryFn: () =>
      productService.getProducts({
        categorySlug: selectedCategorySlug || undefined,
        brand: selectedBrand || undefined,
        maxPrice: maxPrice < 100000000 ? maxPrice : undefined,
        sortBy: sortBy || undefined,
        search: searchQuery || undefined,
        specKey,
        specValue,
        page,
        size: 15,
      }),
  });

  const productsData = productsRes?.data;
  const products: ProductListItem[] =
    productsData?.items ||
    productsData?.content ||
    (Array.isArray(productsData) ? (productsData as any) : []);
  const totalPages =
    productsData?.pagination?.totalPages || productsData?.totalPages || 1;
  const totalElements =
    productsData?.pagination?.totalItems ||
    productsData?.totalElements ||
    products.length;

  // Clear All Filters
  const handleClearFilters = () => {
    setSelectedCategorySlug("");
    setSelectedCategoryName("Tất cả sản phẩm");
    setSelectedBrand("");
    setSortBy("");
    setMaxPrice(100000000);
    setSelectedRam("");
    setSelectedCpu("");
    setPage(0);
  };

  const activeFiltersCount =
    (selectedCategorySlug ? 1 : 0) +
    (selectedBrand ? 1 : 0) +
    (sortBy ? 1 : 0) +
    (selectedRam ? 1 : 0) +
    (selectedCpu ? 1 : 0) +
    (maxPrice < 100000000 ? 1 : 0);

  const formatCurrency = (val: number) => {
    if (!val) return "Liên hệ";
    return new Intl.NumberFormat("vi-VN").format(val) + "đ";
  };

  return (
    <div className="w-full bg-[#F2F2F2] dark:bg-zinc-950 text-black dark:text-white transition-colors duration-300">
      {/* HEADER SECTION */}
      <section className="w-full border-b border-black dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="w-[1920px] max-w-full mx-auto p-8 lg:p-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <span className="text-xs uppercase tracking-widest font-bold text-indigo-600 dark:text-indigo-400">
              Cửa Hàng Laptop & Công Nghệ
            </span>
            <h1 className="text-[36px] sm:text-[54px] lg:text-[72px] font-bold tracking-tight leading-none text-black dark:text-white mt-1">
              {selectedCategoryName}
            </h1>
          </div>
          <span className="text-sm font-semibold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-4 py-2 rounded-full border border-black/10 dark:border-white/10">
            Tìm thấy <strong className="text-black dark:text-white font-bold">{totalElements}</strong> sản phẩm
          </span>
        </div>
      </section>

      {/* TAB & FILTER BAR */}
      <section className="w-full border-b border-black dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
        <div className="w-[1920px] max-w-full mx-auto flex flex-col md:flex-row items-stretch justify-between">
          {/* CATEGORY TABS */}
          <div className="flex items-center overflow-x-auto divide-x divide-black/10 dark:divide-zinc-800 scrollbar-none">
            {categories.slice(0, 7).map((cat) => (
              <button
                key={cat.slug}
                onClick={() => {
                  setSelectedCategorySlug(cat.slug);
                  setSelectedCategoryName(cat.slug ? cat.name : "Tất cả sản phẩm");
                  setPage(0);
                }}
                className={`px-6 py-4 text-[16px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategorySlug === cat.slug
                    ? "bg-black text-white dark:bg-white dark:text-black"
                    : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-black dark:text-white"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* POPOVER BỘ LỌC */}
          <Popover>
            <PopoverTrigger asChild>
              <button className="px-6 py-4 flex items-center gap-3 font-semibold text-[16px] border-t md:border-t-0 md:border-l border-black dark:border-zinc-800 hover:bg-[#C5FA1F] hover:text-black transition-colors cursor-pointer text-black dark:text-white focus:outline-none">
                <SlidersHorizontal className="w-5 h-5" />
                <span>
                  Bộ lọc {activeFiltersCount > 0 ? `(${activeFiltersCount})` : ""}
                </span>
                <ChevronDown className="w-5 h-5" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              sideOffset={0}
              className="w-[480px] max-w-[calc(100vw-32px)] p-6 border border-black dark:border-zinc-800 bg-[#F2F2F2] dark:bg-zinc-950 rounded-none shadow-xl space-y-6 z-30"
            >
              {activeFiltersCount > 0 && (
                <div className="space-y-3 pb-4 border-b border-black/25 dark:border-white/25">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase font-bold text-zinc-500 tracking-wider">
                      Đang chọn lọc
                    </span>
                    <button
                      onClick={handleClearFilters}
                      className="text-xs font-semibold underline text-red-500 hover:text-red-700 cursor-pointer"
                    >
                      Bỏ chọn tất cả
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {selectedCategorySlug && (
                      <span className="inline-flex items-center gap-2 px-3 py-1 bg-white dark:bg-zinc-800 border border-black text-xs font-bold">
                        {selectedCategoryName}
                        <X className="w-3.5 h-3.5 cursor-pointer" onClick={() => setSelectedCategorySlug("")} />
                      </span>
                    )}
                    {selectedRam && (
                      <span className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 border border-indigo-500 text-xs font-bold">
                        RAM: {selectedRam}
                        <X className="w-3.5 h-3.5 cursor-pointer" onClick={() => setSelectedRam("")} />
                      </span>
                    )}
                    {selectedCpu && (
                      <span className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 border border-purple-500 text-xs font-bold">
                        CPU: {selectedCpu}
                        <X className="w-3.5 h-3.5 cursor-pointer" onClick={() => setSelectedCpu("")} />
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Sort By */}
              <div className="space-y-3">
                <h3 className="text-[18px] font-bold text-black dark:text-white">Sắp xếp sản phẩm</h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "", label: "Mặc định / Mới nhất" },
                    { id: "price-asc", label: "Giá: Thấp đến Cao" },
                    { id: "price-desc", label: "Giá: Cao đến Thấp" },
                    { id: "name-asc", label: "Tên: A - Z" },
                  ].map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setSortBy(option.id)}
                      className={`p-2.5 text-xs font-semibold border text-left transition-all ${
                        sortBy === option.id
                          ? "bg-black text-white border-black dark:bg-white dark:text-black"
                          : "bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* EAV Filter: RAM */}
              <div className="space-y-3 pt-4 border-t border-black/25 dark:border-white/25">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-indigo-500" />
                  <h3 className="text-[18px] font-bold text-black dark:text-white">Lọc theo Dung lượng RAM (EAV)</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {["8GB", "16GB", "32GB", "64GB"].map((ram) => (
                    <button
                      key={ram}
                      onClick={() => {
                        setSelectedRam(selectedRam === ram ? "" : ram);
                        setSelectedCpu(""); // Ưu tiên lọc 1 spec key
                      }}
                      className={`px-4 py-2 border text-xs font-bold transition-all cursor-pointer ${
                        selectedRam === ram
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 hover:border-indigo-400"
                      }`}
                    >
                      {ram}
                    </button>
                  ))}
                </div>
              </div>

              {/* EAV Filter: CPU */}
              <div className="space-y-3 pt-4 border-t border-black/25 dark:border-white/25">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-purple-500" />
                  <h3 className="text-[18px] font-bold text-black dark:text-white">Lọc theo Loại CPU (EAV)</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {["Intel", "Apple M", "AMD Ryzen", "Core Ultra"].map((cpu) => (
                    <button
                      key={cpu}
                      onClick={() => {
                        setSelectedCpu(selectedCpu === cpu ? "" : cpu);
                        setSelectedRam(""); // Ưu tiên lọc 1 spec key
                      }}
                      className={`px-4 py-2 border text-xs font-bold transition-all cursor-pointer ${
                        selectedCpu === cpu
                          ? "bg-purple-600 text-white border-purple-600"
                          : "bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 hover:border-purple-400"
                      }`}
                    >
                      {cpu}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Slider */}
              <div className="space-y-3 pt-4 border-t border-black/25 dark:border-white/25">
                <div className="flex items-center justify-between text-black dark:text-white">
                  <h3 className="text-[18px] font-bold">Giá tối đa</h3>
                  <span className="text-[16px] font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(maxPrice)}</span>
                </div>
                <input
                  type="range"
                  min={5000000}
                  max={100000000}
                  step={2000000}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-black dark:accent-white cursor-pointer"
                />
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </section>

      {/* MAIN BODY: PRODUCT GRID */}
      <section className="w-full">
        <div className="w-[1920px] max-w-full mx-auto">
          <div className="w-full">
            {loading ? (
              <div className="p-32 text-center text-xl font-bold text-black dark:text-white bg-[#F2F2F2] dark:bg-zinc-950">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-black dark:border-white border-t-transparent mb-4"></div>
                <p>Đang tải danh sách sản phẩm từ Backend...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="p-20 text-center space-y-4 text-black dark:text-white bg-[#F2F2F2] dark:bg-zinc-950">
                <h3 className="text-2xl font-bold">Không tìm thấy sản phẩm nào</h3>
                <p className="text-zinc-500">Vui lòng thử chọn lại danh mục hoặc bỏ bớt các điều kiện lọc.</p>
                <button
                  onClick={handleClearFilters}
                  className="px-6 py-3 bg-black text-white dark:bg-white dark:text-black text-sm font-semibold hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Bỏ chọn tất cả bộ lọc
                </button>
              </div>
            ) : (
              <div className="p-6 lg:p-8 bg-[#F2F2F2] dark:bg-zinc-950">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {products.map((product) => (
                    <Link
                      href={`/product/${product.slug || product.id}`}
                      key={product.id}
                      className="group flex flex-col justify-between hover:shadow-xl transition-all duration-300 border border-black/10 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg overflow-hidden"
                    >
                    {/* Image Area */}
                    <div className="relative w-full aspect-square flex items-center justify-center p-8 border-b border-black/10 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
                      <Image
                        src={product.thumbnail || "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/Laptop_d170e53d32.png"}
                        alt={product.name}
                        fill
                        className="object-contain p-6 group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      />
                      
                      {/* Brand Badge */}
                      {product.brand && (
                        <div className="absolute top-4 left-4 z-10">
                          <span className="px-3 py-1 bg-zinc-900 text-white text-[12px] font-bold uppercase tracking-wider rounded-sm">
                            {product.brand}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Info Area */}
                    <div className="p-6 flex flex-col justify-between items-start text-black dark:text-white flex-1 gap-4">
                      <div className="space-y-1.5 w-full">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                            {product.categoryName}
                          </span>
                          {(product.ratingAvg !== undefined && product.ratingAvg !== null) && (
                            <div className="flex items-center gap-1 text-amber-500 text-xs font-semibold">
                              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                              <span>{Number(product.ratingAvg).toFixed(1)}</span>
                              {product.reviewCount ? (
                                <span className="text-zinc-400">({product.reviewCount})</span>
                              ) : null}
                            </div>
                          )}
                        </div>
                        <h3 className="text-[18px] sm:text-[20px] font-bold tracking-tight line-clamp-2 group-hover:text-indigo-600 transition-colors">
                          {product.name}
                        </h3>
                      </div>
                      
                      <div className="flex flex-col gap-3 w-full pt-3 border-t border-black/10 dark:border-zinc-800">
                        <div className="flex items-baseline gap-2 w-full">
                          <span className="text-[14px] text-zinc-500 font-medium">Giá từ:</span>
                          <span className="text-[22px] sm:text-[24px] font-extrabold text-indigo-700 dark:text-indigo-400">
                            {formatCurrency(product.priceFrom)}
                          </span>
                        </div>
                        <span className="w-full py-2.5 bg-black dark:bg-white text-white dark:text-black font-semibold text-center block text-sm border border-black dark:border-white group-hover:bg-[#C5FA1F] group-hover:text-black transition-colors">
                          Xem chi tiết
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

            {/* PAGINATION SECTION */}
            {totalPages > 1 && (
              <div className="p-8 flex items-center justify-between border-t border-black/10 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                  Trang {page + 1} / {totalPages} (Tổng {totalElements} sản phẩm)
                </span>

                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-10 h-10 border border-black font-bold text-sm transition-colors cursor-pointer ${
                        p === page
                          ? "bg-black text-white dark:bg-white dark:text-black"
                          : "bg-white dark:bg-zinc-800 hover:bg-[#C5FA1F] hover:text-black text-black dark:text-white"
                      }`}
                    >
                      {p + 1}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default function ShopPage() {
  return (
    <PublicLayout fullWidth>
      <Suspense fallback={<div className="p-12 text-center text-xl font-bold">Đang tải cửa hàng...</div>}>
        <ShopContent />
      </Suspense>
    </PublicLayout>
  );
}
