"use client";

import React, { useState, useMemo, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import PublicLayout from "@/shared/layouts/PublicLayout";
import { ChevronDown, ChevronUp, Star, X, SlidersHorizontal } from "lucide-react";

// Product Dataset matching Figma PLP specification
const ALL_PRODUCTS = [
  {
    id: "prod-1",
    name: "Carbon Shadow Pro",
    category: "Điện thoại",
    useCase: "Làm việc",
    price: 5000000,
    originalPrice: 6000000,
    discountBadge: "-20%",
    statusBadge: "Bán chạy",
    image: "/figma/product_1.png",
    rating: 5.0,
    reviewsCount: 24,
    featured: true,
  },
  {
    id: "prod-2",
    name: "Nimbus Drift Frost",
    category: "Máy tính",
    useCase: "Làm việc",
    price: 15000000,
    originalPrice: null,
    discountBadge: null,
    statusBadge: "Bán chạy",
    image: "/figma/product_2.png",
    rating: 4.9,
    reviewsCount: 18,
    featured: true,
  },
  {
    id: "prod-3",
    name: "Voltflare Spectrum",
    category: "Máy tính",
    useCase: "Gaming",
    price: 25000000,
    originalPrice: null,
    discountBadge: null,
    statusBadge: "Bán chạy",
    image: "/figma/product_3.png",
    rating: 4.8,
    reviewsCount: 31,
    featured: false,
  },
  {
    id: "prod-4",
    name: "Lunar Surge Neon",
    category: "Điện thoại",
    useCase: "Gaming",
    price: 8000000,
    originalPrice: 10000000,
    discountBadge: "-20%",
    statusBadge: "Bán chạy",
    image: "/figma/product_4.png",
    rating: 5.0,
    reviewsCount: 12,
    featured: true,
  },
  {
    id: "prod-5",
    name: "Ashen Path Xtreme",
    category: "Phụ kiện",
    useCase: "Giải trí",
    price: 1200000,
    originalPrice: null,
    discountBadge: null,
    statusBadge: "Bán chạy",
    image: "/figma/product_5.png",
    rating: 4.9,
    reviewsCount: 45,
    featured: false,
  },
  {
    id: "prod-6",
    name: "ProArt StudioBook P16",
    category: "Máy tính",
    useCase: "Làm việc",
    price: 32000000,
    originalPrice: 35000000,
    discountBadge: "-8%",
    statusBadge: "Bán chạy",
    image: "/figma/cat_laptop.png",
    rating: 4.9,
    reviewsCount: 29,
    featured: true,
  },
  {
    id: "prod-7",
    name: "Smart Headset Pulse 3D",
    category: "Phụ kiện",
    useCase: "Gaming",
    price: 3500000,
    originalPrice: 4000000,
    discountBadge: "-12%",
    statusBadge: null,
    image: "/figma/cat_acc.png",
    rating: 4.7,
    reviewsCount: 15,
    featured: false,
  },
  {
    id: "prod-8",
    name: "CyberDeck Smartphone Ultra",
    category: "Điện thoại",
    useCase: "Giải trí",
    price: 18000000,
    originalPrice: null,
    discountBadge: null,
    statusBadge: "Mới ra mắt",
    image: "/figma/cat_phone.png",
    rating: 5.0,
    reviewsCount: 8,
    featured: true,
  },
];

function ShopContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") || "Tất cả";
  const initialUseCase = searchParams.get("use_case") || "";

  // State Management
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [showFilterPanel, setShowFilterPanel] = useState<boolean>(true);
  const [sortBy, setSortBy] = useState<string>("featured");
  const [selectedUseCases, setSelectedUseCases] = useState<string[]>(initialUseCase ? [initialUseCase] : []);
  const [maxPrice, setMaxPrice] = useState<number>(200000000);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Categories Tab List
  const CATEGORIES = ["Tất cả", "Điện thoại", "Máy tính", "Phụ kiện"];

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

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    return ALL_PRODUCTS.filter((product) => {
      if (selectedCategory !== "Tất cả" && product.category !== selectedCategory) {
        return false;
      }
      if (selectedUseCases.length > 0 && !selectedUseCases.includes(product.useCase)) {
        return false;
      }
      if (product.price > maxPrice) {
        return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === "bestseller") return (b.reviewsCount || 0) - (a.reviewsCount || 0);
      if (sortBy === "price-low") return a.price - b.price;
      if (sortBy === "price-high") return b.price - a.price;
      return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
    });
  }, [selectedCategory, selectedUseCases, maxPrice, sortBy]);

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
          <h1 className="text-[36px] sm:text-[60px] lg:text-[96px] font-bold tracking-tight leading-none">
            {selectedCategory}
          </h1>
        </div>
      </section>

      {/* TAB & FILTER BAR */}
      <section className="w-full border-b border-black dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky top-[60px] z-20 shadow-sm">
        <div className="w-[1920px] max-w-full mx-auto flex flex-col md:flex-row items-stretch justify-between">
          <button
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className="px-6 py-4 flex items-center gap-3 font-semibold text-[18px] border-b md:border-b-0 md:border-r border-black dark:border-zinc-800 hover:bg-[#C5FA1F] hover:text-black transition-colors cursor-pointer"
          >
            <SlidersHorizontal className="w-5 h-5" />
            <span>
              {showFilterPanel ? `Ẩn bộ lọc (${activeFiltersCount})` : `Hiển thị bộ lọc (${activeFiltersCount})`}
            </span>
            {showFilterPanel ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>

          <div className="flex items-center overflow-x-auto divide-x divide-black dark:divide-zinc-800 border-t md:border-t-0 border-black dark:border-zinc-800">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-8 py-4 text-[18px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-black text-white dark:bg-white dark:text-black"
                    : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* MAIN BODY: FILTER PANEL + PRODUCT GRID */}
      <section className="w-full border-b border-black dark:border-zinc-800">
        <div className="w-[1920px] max-w-full mx-auto flex flex-col lg:flex-row">
          
          {/* COLLAPSIBLE FILTER PANEL */}
          {showFilterPanel && (
            <aside className="w-full lg:w-[360px] shrink-0 border-b lg:border-b-0 lg:border-r border-black dark:border-zinc-800 p-8 space-y-8 bg-white dark:bg-zinc-900">
              {activeFiltersCount > 0 && (
                <div className="space-y-3 pb-6 border-b border-black/10 dark:border-white/10">
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
                      <span className="inline-flex items-center gap-2 px-3 py-1 bg-[#F2F2F2] dark:bg-zinc-800 border border-black text-xs font-bold">
                        {selectedCategory}
                        <X className="w-3.5 h-3.5 cursor-pointer" onClick={() => setSelectedCategory("Tất cả")} />
                      </span>
                    )}
                    {selectedUseCases.map((uc) => (
                      <span
                        key={uc}
                        className="inline-flex items-center gap-2 px-3 py-1 bg-[#F2F2F2] dark:bg-zinc-800 border border-black text-xs font-bold"
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
                <h3 className="text-[20px] font-bold">Sắp xếp theo</h3>
                <div className="space-y-3">
                  {[
                    { id: "featured", label: "Nổi bật" },
                    { id: "bestseller", label: "Sản phẩm bán chạy nhất" },
                    { id: "price-low", label: "Giá: Thấp đến Cao" },
                    { id: "price-high", label: "Giá: Cao đến Thấp" },
                  ].map((option) => (
                    <label key={option.id} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="sortBy"
                        checked={sortBy === option.id}
                        onChange={() => setSortBy(option.id)}
                        className="w-4 h-4 text-black border-black focus:ring-0"
                      />
                      <span className="text-[16px] font-medium">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Use Cases */}
              <div className="space-y-4 pt-6 border-t border-black/10 dark:border-white/10">
                <h3 className="text-[20px] font-bold">Nhu cầu</h3>
                <div className="space-y-3">
                  {["Làm việc", "Gaming", "Giải trí"].map((uc) => (
                    <label key={uc} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedUseCases.includes(uc)}
                        onChange={() => toggleUseCase(uc)}
                        className="w-4 h-4 text-black border-black focus:ring-0"
                      />
                      <span className="text-[16px] font-medium">{uc}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Slider */}
              <div className="space-y-4 pt-6 border-t border-black/10 dark:border-white/10">
                <div className="flex items-center justify-between">
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
            </aside>
          )}

          {/* PRODUCT GRID */}
          <div className="flex-1">
            {filteredProducts.length === 0 ? (
              <div className="p-16 text-center space-y-4">
                <h3 className="text-2xl font-bold">Không tìm thấy sản phẩm nào</h3>
                <p className="text-zinc-500">Vui lòng điều chỉnh lại bộ lọc để tìm sản phẩm phù hợp.</p>
                <button
                  onClick={handleClearFilters}
                  className="px-6 py-3 bg-black text-white text-sm font-semibold hover:bg-zinc-800 transition-colors"
                >
                  Xóa tất cả bộ lọc
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-black dark:divide-zinc-800 border-b border-black dark:border-zinc-800">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="group relative flex flex-col justify-between bg-white dark:bg-zinc-900 p-6 lg:p-8 hover:bg-[#F9F9F9] dark:hover:bg-zinc-800/80 transition-all duration-300 border-b border-black dark:border-zinc-800"
                  >
                    {/* Badges */}
                    <div className="flex items-center justify-between z-10">
                      {product.statusBadge && (
                        <span className="px-3 py-1 bg-[#623CEA] text-white text-xs font-bold uppercase tracking-wider rounded-none shadow">
                          {product.statusBadge}
                        </span>
                      )}
                      {product.discountBadge && (
                        <span className="px-3 py-1 bg-[#E01715] text-white text-xs font-bold uppercase tracking-wider rounded-none shadow ml-auto">
                          {product.discountBadge}
                        </span>
                      )}
                    </div>

                    {/* Image */}
                    <div className="relative w-full aspect-square my-6 overflow-hidden flex items-center justify-center">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>

                    {/* Info */}
                    <div className="space-y-3 pt-4 border-t border-black/10 dark:border-white/10">
                      <div className="flex items-center gap-1 text-amber-500 text-xs font-semibold">
                        <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                        <span>{product.rating}</span>
                        <span className="text-zinc-400">({product.reviewsCount})</span>
                      </div>

                      <h3 className="text-[20px] font-bold group-hover:text-primary transition-colors line-clamp-1">
                        {product.name}
                      </h3>

                      <div className="flex items-baseline gap-3">
                        <span className="text-[22px] font-extrabold text-black dark:text-white">
                          {formatCurrency(product.price)}
                        </span>
                        {product.originalPrice && (
                          <span className="text-sm line-through text-zinc-400 font-medium">
                            {formatCurrency(product.originalPrice)}
                          </span>
                        )}
                      </div>

                      <Link
                        href={`/product/${product.id}`}
                        className="mt-4 w-full py-3 bg-black dark:bg-white text-white dark:text-black font-semibold text-center block border border-black hover:bg-[#C5FA1F] hover:text-black transition-colors"
                      >
                        Thêm vào giỏ
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* PAGINATION SECTION */}
            <div className="p-8 flex items-center justify-between bg-[#F2F2F2] dark:bg-zinc-900">
              <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                Hiển thị 1 - {filteredProducts.length} trong tổng số {filteredProducts.length} sản phẩm
              </span>

              <div className="flex items-center gap-2">
                {[1, 2, 3].map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 border border-black font-bold text-sm transition-colors ${
                      currentPage === page
                        ? "bg-black text-white dark:bg-white dark:text-black"
                        : "bg-white dark:bg-zinc-800 hover:bg-[#C5FA1F] hover:text-black"
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
