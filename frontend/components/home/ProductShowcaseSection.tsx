"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ChevronLeft, ChevronRight, Star, ShoppingBag, Check } from "lucide-react";
import { ProductListItem } from "@/services/productServices";
import { HomeLayoutSection } from "@/types/home";

interface ProductShowcaseSectionProps {
  section?: HomeLayoutSection;
  products: ProductListItem[];
  loading?: boolean;
}

export default function ProductShowcaseSection({
  section,
  products,
  loading = false,
}: ProductShowcaseSectionProps) {
  const [sliderIndex, setSliderIndex] = useState(0);
  const [addedProductId, setAddedProductId] = useState<string | null>(null);

  const title = section?.title || "Sản phẩm được yêu thích nhất";
  const subtitle = section?.subtitle || "Sản phẩm nổi bật";

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("vi-VN").format(val) + " ₫";
  };

  const handlePrevSlide = () => {
    setSliderIndex((prev) => (prev === 0 ? Math.max(0, products.length - 5) : prev - 1));
  };

  const handleNextSlide = () => {
    setSliderIndex((prev) => (prev >= products.length - 5 ? 0 : prev + 1));
  };

  const handleAddToCart = (product: ProductListItem) => {
    window.location.href = `/product/${product.slug || product.id}`;
  };

  const visibleProducts = products.slice(sliderIndex, sliderIndex + 5);

  return (
    <section className="w-full border-b border-black dark:border-zinc-800">
      <div className="w-[1920px] max-w-full mx-auto">
        {/* Header Title */}
        <div className="p-8 lg:p-12 border-b border-black dark:border-zinc-800 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span className="px-3 py-1 bg-black text-white text-xs font-bold uppercase tracking-wider">
              {subtitle}
            </span>
            <h2 className="mt-2 text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-balance leading-none">
              {title}
            </h2>
          </div>

          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white dark:bg-white dark:text-black font-bold text-sm hover:bg-[#C5FA1F] hover:text-black transition-colors self-start md:self-auto uppercase tracking-wider"
          >
            Xem tất cả {products.length} sản phẩm
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="py-24 text-center text-zinc-500 font-medium">Đang tải danh sách sản phẩm từ hệ thống…</div>
        ) : products.length === 0 ? (
          <div className="py-24 text-center text-zinc-500 font-medium">Không tìm thấy sản phẩm nào khả dụng.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-black dark:divide-zinc-800 border-b border-black dark:border-zinc-800">
            {(visibleProducts.length ? visibleProducts : products.slice(0, 5)).map((product) => {
              const isJustAdded = addedProductId === product.id;
              const price = Number(product.priceFrom || 0);

              return (
                <div
                  key={product.id}
                  className="group relative flex flex-col justify-between bg-white dark:bg-zinc-900 p-6 lg:p-8 hover:bg-[#F9F9F9] dark:hover:bg-zinc-800/80 transition-all duration-300"
                >
                  {/* Badges Overlay */}
                  <div className="flex items-center justify-between z-10">
                    <span className="px-2.5 py-1 bg-[#623CEA] text-white text-[10px] font-black uppercase tracking-wider">
                      {product.brand || "CHÍNH HÃNG"}
                    </span>
                    {product.categoryName && (
                      <span className="px-2.5 py-1 bg-black text-white text-[10px] font-bold uppercase tracking-wider ml-auto">
                        {product.categoryName}
                      </span>
                    )}
                  </div>

                  {/* Product Image */}
                  <Link href={`/product/${product.slug || product.id}`} className="block relative w-full aspect-square my-6 overflow-hidden flex items-center justify-center">
                    <Image
                      src={product.thumbnail || "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&auto=format&fit=crop&q=80"}
                      alt={product.name}
                      fill
                      className="object-contain p-2 group-hover:scale-105 transition-transform duration-500"
                    />
                  </Link>

                  {/* Product Details */}
                  <div className="space-y-3 pt-4 border-t border-black/10 dark:border-white/10">
                    <div className="flex items-center gap-1 text-amber-500 text-xs font-semibold">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      <span>{product.ratingAvg || 5.0}</span>
                      <span className="text-zinc-400">({product.reviewCount || 12})</span>
                    </div>

                    <h3 className="text-base font-bold group-hover:text-indigo-600 transition-colors line-clamp-2 min-h-[48px]">
                      <Link href={`/product/${product.slug || product.id}`}>
                        {product.name}
                      </Link>
                    </h3>

                    <div className="flex items-baseline gap-2 pt-1">
                      <span className="text-xl font-extrabold font-mono text-black dark:text-white">
                        {formatCurrency(price)}
                      </span>
                    </div>

                    <button
                      onClick={() => handleAddToCart(product)}
                      className={`mt-4 w-full py-3 font-bold text-xs uppercase tracking-wider text-center flex items-center justify-center gap-2 border border-black transition-all cursor-pointer ${
                        isJustAdded
                          ? "bg-green-600 text-white border-green-600"
                          : "bg-black dark:bg-white text-white dark:text-black hover:bg-[#C5FA1F] hover:text-black"
                      }`}
                    >
                      {isJustAdded ? (
                        <>
                          <Check size={14} /> Đã thêm vào giỏ
                        </>
                      ) : (
                        <>
                          <ShoppingBag size={14} /> Thêm vào giỏ
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Slider Controls Bar */}
        {products.length > 5 && (
          <div className="p-6 flex items-center justify-between bg-[#F2F2F2] dark:bg-zinc-900">
            <div className="text-xs font-bold font-mono text-zinc-500">
              Hiển thị {sliderIndex + 1} - {Math.min(sliderIndex + 5, products.length)} trên {products.length} sản phẩm
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handlePrevSlide}
                className="p-2.5 border border-black bg-white dark:bg-zinc-800 text-black dark:text-white hover:bg-[#C5FA1F] hover:text-black transition-colors cursor-pointer"
                aria-label="Sản phẩm trước"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNextSlide}
                className="p-2.5 border border-black bg-white dark:bg-zinc-800 text-black dark:text-white hover:bg-[#C5FA1F] hover:text-black transition-colors cursor-pointer"
                aria-label="Sản phẩm tiếp"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
