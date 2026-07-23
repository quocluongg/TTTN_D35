"use client";

import React, { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import PublicLayout from "@/shared/layouts/PublicLayout";
import { ChevronDown, X, SlidersHorizontal } from "lucide-react";
import { productService, Product } from "@/services/productServices";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

function ShopContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") || "Tất cả";
  const initialUseCase = searchParams.get("use_case") || "";

  // State Management
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [sortBy, setSortBy] = useState<string>("featured");
  const [selectedUseCases, setSelectedUseCases] = useState<string[]>(initialUseCase ? [initialUseCase] : []);
  const [maxPrice, setMaxPrice] = useState<number>(200000000);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(["Tất cả", "Điện thoại", "Máy tính", "Phụ kiện"]);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch categories on mount
  useEffect(() => {
    productService.getCategories()
      .then((res) => {
        if (res.success && res.data) {
          // Normalize and prevent duplicate categories
          const cats = Array.from(new Set(["Tất cả", ...res.data]));
          setCategories(cats);
        }
      })
      .catch((err) => console.error("Lỗi lấy danh mục:", err));
  }, []);

  // Fetch products when parameters change
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const delayDebounce = setTimeout(() => {
      productService.getProducts({
        category: selectedCategory,
        use_case: selectedUseCases,
        max_price: maxPrice,
        sort_by: sortBy
      })
      .then((res) => {
        if (isMounted && res.success && res.data) {
          setProducts(res.data);
        }
      })
      .catch((err) => console.error("Lỗi lấy sản phẩm:", err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(delayDebounce);
    };
  }, [selectedCategory, selectedUseCases, maxPrice, sortBy]);

  // Handle Checkbox for Use Cases
  const toggleUseCase = (useCase: string) => {
    setSelectedUseCases((prev) =>
      prev.includes(useCase) ? prev.filter((item) => item !== useCase) : [...prev, useCase]
    );
  };

  // Clear All Filters
  const handleClearFilters = () => {
    setSelectedCategory("Tất cả");
    setSelectedUseCases([]);
    setSortBy("featured");
    setMaxPrice(200000000);
  };

  const activeFiltersCount =
    (selectedCategory !== "Tất cả" ? 1 : 0) + selectedUseCases.length + (sortBy !== "featured" ? 1 : 0);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("vi-VN").format(val) + "đ";
  };

  return (
    <div className="w-full bg-[#F2F2F2] dark:bg-zinc-950 text-black dark:text-white transition-colors duration-300">
      {/* HEADER SECTION */}
      <section className="w-full border-b border-black dark:border-zinc-800">
        <div className="w-[1920px] max-w-full mx-auto p-8 lg:p-12">
          <h1 className="text-[36px] sm:text-[60px] lg:text-[96px] font-medium tracking-tight leading-none text-black dark:text-white">
            {selectedCategory}
          </h1>
        </div>
      </section>

      {/* TAB & FILTER BAR */}
      <section className="w-full border-b border-black dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky top-[60px] z-20 shadow-sm">
        <div className="w-[1920px] max-w-full mx-auto flex flex-col md:flex-row items-stretch justify-between">
          <div className="flex items-center overflow-x-auto divide-x divide-black dark:divide-zinc-800">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-8 py-4 text-[18px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-black text-white dark:bg-white dark:text-black"
                    : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-black dark:text-white"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <button
                className="px-6 py-4 flex items-center gap-3 font-semibold text-[18px] border-t md:border-t-0 md:border-l border-black dark:border-zinc-800 hover:bg-[#C5FA1F] hover:text-black transition-colors cursor-pointer text-black dark:text-white focus:outline-hidden"
              >
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
              className="w-[480px] max-w-[calc(100vw-32px)] p-8 border border-black dark:border-zinc-800 bg-[#F2F2F2] dark:bg-zinc-950 rounded-none shadow-lg space-y-8 z-30"
            >
              {activeFiltersCount > 0 && (
                <div className="space-y-3 pb-6 border-b border-black/25 dark:border-white/25">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase font-bold text-zinc-500 tracking-wider">
                      Đang lọc theo
                    </span>
                    <button
                      onClick={handleClearFilters}
                      className="text-xs font-semibold underline text-red-500 hover:text-red-700 cursor-pointer"
                    >
                      Tắt bộ lọc
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {selectedCategory !== "Tất cả" && (
                      <span className="inline-flex items-center gap-2 px-3 py-1 bg-white dark:bg-zinc-800 border border-black text-xs font-bold text-black dark:text-white">
                        {selectedCategory}
                        <X className="w-3.5 h-3.5 cursor-pointer" onClick={() => setSelectedCategory("Tất cả")} />
                      </span>
                    )}
                    {selectedUseCases.map((uc) => (
                      <span
                        key={uc}
                        className="inline-flex items-center gap-2 px-3 py-1 bg-white dark:bg-zinc-800 border border-black text-xs font-bold text-black dark:text-white"
                      >
                        {uc}
                        <X className="w-3.5 h-3.5 cursor-pointer" onClick={() => toggleUseCase(uc)} />
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Sort By */}
              <div className="space-y-4">
                <h3 className="text-[20px] font-bold text-black dark:text-white">Sắp xếp theo</h3>
                <div className="space-y-3">
                  {[
                    { id: "featured", label: "Nổi bật" },
                    { id: "bestseller", label: "Sản phẩm bán chạy nhất" },
                    { id: "price-low", label: "Giá: Thấp đến Cao" },
                    { id: "price-high", label: "Giá: Cao đến Thấp" },
                  ].map((option) => (
                    <label key={option.id} className="flex items-center gap-3 cursor-pointer text-black dark:text-white">
                      <input
                        type="radio"
                        name="sortBy"
                        checked={sortBy === option.id}
                        onChange={() => setSortBy(option.id)}
                        className="w-4 h-4 text-black border-black focus:ring-0 accent-black dark:accent-white"
                      />
                      <span className="text-[16px] font-medium">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Use Cases */}
              <div className="space-y-4 pt-6 border-t border-black/25 dark:border-white/25">
                <h3 className="text-[20px] font-bold text-black dark:text-white">Nhu cầu</h3>
                <div className="space-y-3">
                  {["Làm việc", "Gaming", "Giải trí"].map((uc) => (
                    <label key={uc} className="flex items-center gap-3 cursor-pointer text-black dark:text-white">
                      <input
                        type="checkbox"
                        checked={selectedUseCases.includes(uc)}
                        onChange={() => toggleUseCase(uc)}
                        className="w-4 h-4 text-black border-black focus:ring-0 accent-black dark:accent-white"
                      />
                      <span className="text-[16px] font-medium">{uc}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Slider */}
              <div className="space-y-4 pt-6 border-t border-black/25 dark:border-white/25">
                <div className="flex items-center justify-between text-black dark:text-white">
                  <h3 className="text-[20px] font-bold">Giá tối đa</h3>
                  <span className="text-[16px] font-bold">{formatCurrency(maxPrice)}</span>
                </div>

                <input
                  type="range"
                  min={1000000}
                  max={200000000}
                  step={1000000}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-black dark:accent-white cursor-pointer"
                />

                <div className="flex justify-between text-xs font-semibold text-zinc-500">
                  <span>1.000.000đ</span>
                  <span>200.000.000đ</span>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </section>

      {/* MAIN BODY: PRODUCT GRID */}
      <section className="w-full">
        <div className="w-[1920px] max-w-full mx-auto">
          {/* PRODUCT GRID */}
          <div className="w-full">
            {loading ? (
              <div className="p-32 text-center text-xl font-bold text-black dark:text-white bg-[#F2F2F2] dark:bg-zinc-950">
                Đang tải sản phẩm...
              </div>
            ) : products.length === 0 ? (
              <div className="p-16 text-center space-y-4 text-black dark:text-white bg-[#F2F2F2] dark:bg-zinc-950">
                <h3 className="text-2xl font-bold">Không tìm thấy sản phẩm nào</h3>
                <p className="text-zinc-500">Vui lòng điều chỉnh lại bộ lọc để tìm sản phẩm phù hợp.</p>
                <button
                  onClick={handleClearFilters}
                  className="px-6 py-3 bg-black text-white text-sm font-semibold hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Xóa tất cả bộ lọc
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 border-t border-l border-black dark:border-zinc-800 bg-[#F2F2F2] dark:bg-zinc-950">
                {products.map((product) => (
                  <Link
                    href={`/product/${product.id}`}
                    key={product.id}
                    className="group flex flex-col justify-between hover:opacity-95 transition-all duration-300 border-r border-b border-black dark:border-zinc-800 bg-[#F2F2F2] dark:bg-zinc-950"
                  >
                    {/* Image Area */}
                    <div className="relative w-full aspect-[480/562] flex items-center justify-center p-8 border-b border-black dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        className="object-contain p-6 group-hover:scale-102 transition-transform duration-500"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      />
                      
                      {/* Badges */}
                      <div className="absolute top-4 right-4 flex flex-col gap-2 items-end z-10">
                        {product.statusBadge && (
                          <span className="px-3 py-1 bg-[#623CEA] text-white text-[14px] font-medium uppercase tracking-wider">
                            {product.statusBadge}
                          </span>
                        )}
                        {product.discountBadge && (
                          <span className="px-3 py-1 bg-[#E01715] text-white text-[14px] font-medium uppercase tracking-wider">
                            {product.discountBadge}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Info Area */}
                    <div className="h-[133px] p-6 flex flex-col justify-between items-start bg-[#F2F2F2] dark:bg-zinc-950 text-black dark:text-white">
                      <h3 className="text-[20px] sm:text-[24px] font-medium tracking-tight line-clamp-1">
                        {product.name}
                      </h3>
                      
                      <div className="flex items-baseline gap-3">
                        <span className="text-[24px] sm:text-[32px] font-medium">
                          {formatCurrency(product.price)}
                        </span>
                        {product.originalPrice && (
                          <span className="text-sm sm:text-lg line-through text-zinc-500 font-medium">
                            {formatCurrency(product.originalPrice)}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* PAGINATION SECTION */}
            <div className="p-8 flex items-center justify-between border-t border-black dark:border-zinc-800 bg-[#F2F2F2] dark:bg-zinc-900">
              <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                Hiển thị 1 - {products.length} trong tổng số {products.length} sản phẩm
              </span>

              <div className="flex items-center gap-2">
                {[1, 2, 3].map((page) => (
                  <button
                    key={page}
                    className={`w-10 h-10 border border-black font-bold text-sm transition-colors ${
                      page === 1
                        ? "bg-black text-white dark:bg-white dark:text-black"
                        : "bg-white dark:bg-zinc-800 hover:bg-[#C5FA1F] hover:text-black text-black dark:text-white"
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
            </div>
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
