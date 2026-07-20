"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import PublicLayout from "@/shared/layouts/PublicLayout";
import { ChevronLeft, ChevronRight, Star, CheckCircle2, ShoppingBag } from "lucide-react";

// Mock Product Database matching Shop Dataset & Figma PDP specs
const PRODUCTS_DATA: Record<string, any> = {
  "prod-1": {
    name: "Carbon Shadow Pro",
    brand: "ShopWise Audio",
    model: "Carbon Shadow X1",
    dimensions: "5.12 x 3.54 x 1.97 inches",
    size: "Compact & Portable",
    weight: "Lightweight design",
    totalWeight: "450 grams",
    description:
      "Carbon Shadow Pro kết hợp thiết kế tinh tế với vật liệu hợp kim siêu nhẹ để mang đến trải nghiệm âm thanh chân thực và ấn tượng. Được trang bị vi xử lý âm thanh AI tiên tiến, chiếc tai nghe này hoàn hảo cho công việc, gaming giải trí hoặc di chuyển hàng ngày.",
    price: 5000000,
    originalPrice: 6000000,
    discount: "-20%",
    rating: 5.0,
    reviewsCount: 210,
    images: ["/figma/product_1.png", "/figma/cat_acc.png", "/figma/cat_phone.png"],
  },
  "prod-2": {
    name: "Nimbus Drift Frost",
    brand: "Nimbus",
    model: "Drift Frost Air",
    dimensions: "12.4 x 8.6 x 0.59 inches",
    size: "Ultrabook 14 inch",
    weight: "Thép không gỉ siêu mỏng",
    totalWeight: "1.2 kg",
    description:
      "Nimbus Drift Frost sở hữu màn hình OLED 120Hz sắc nét cùng chip xử lý hiệu năng cao. Thiết kế hợp kim nhôm nguyên khối sang trọng mang lại trải nghiệm học tập và làm việc chuyên nghiệp.",
    price: 15000000,
    originalPrice: null,
    discount: null,
    rating: 4.9,
    reviewsCount: 185,
    images: ["/figma/product_2.png", "/figma/cat_laptop.png", "/figma/product_3.png"],
  },
  default: {
    name: "ASUS VivoBook Pro 15",
    brand: "ASUS",
    model: "Vivo SonicWave X15",
    dimensions: "5.12 x 3.54 x 1.97 inches",
    size: "Compact and portable",
    weight: "Lightweight design",
    totalWeight: "800 grams",
    description:
      "Asus Vivobook kết hợp thiết kế tinh tế với vật liệu nhẹ để mang đến trải nghiệm máy tính hiệu quả và phong cách. Được trang bị sức mạnh xử lý tiên tiến và màn hình sống động, chiếc laptop này hoàn hảo cho công việc, học tập hoặc giải trí. Các tùy chọn màu sắc hiện đại của nó mang đến một không khí tươi mới, đương đại cho bộ sưu tập công nghệ của bạn.",
    price: 5000000,
    originalPrice: 6000000,
    discount: "-20%",
    rating: 5.0,
    reviewsCount: 210,
    images: ["/figma/product_1.png", "/figma/cat_laptop.png", "/figma/product_3.png", "/figma/product_4.png"],
  },
};

const RELATED_PRODUCTS = [
  {
    id: "prod-1",
    name: "Carbon Shadow Pro",
    price: "5.000.000đ",
    originalPrice: "6.000.000đ",
    discount: "-20%",
    status: "Bán chạy",
    image: "/figma/product_1.png",
  },
  {
    id: "prod-2",
    name: "Nimbus Drift Frost",
    price: "5.000.000đ",
    originalPrice: null,
    discount: null,
    status: "Bán chạy",
    image: "/figma/product_2.png",
  },
  {
    id: "prod-4",
    name: "Lunar Surge Neon",
    price: "5.000.000đ",
    originalPrice: null,
    discount: null,
    status: "Bán chạy",
    image: "/figma/product_4.png",
  },
  {
    id: "prod-5",
    name: "Ashen Path Xtreme",
    price: "5.000.000đ",
    originalPrice: null,
    discount: null,
    status: "Bán chạy",
    image: "/figma/product_5.png",
  },
];

export default function ProductDetailPage() {
  const params = useParams();
  const productId = (params.id as string) || "default";

  const product = PRODUCTS_DATA[productId] || PRODUCTS_DATA.default;

  // Image Slider State
  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);

  const handlePrevImage = () => {
    setCurrentImageIdx((prev) => (prev === 0 ? product.images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIdx((prev) => (prev === product.images.length - 1 ? 0 : prev + 1));
  };

  const handleAddToCart = () => {
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2500);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("vi-VN").format(val) + "đ";
  };

  return (
    <PublicLayout fullWidth>
      <div className="w-full bg-[#F2F2F2] dark:bg-zinc-950 text-black dark:text-white transition-colors duration-300">
        
        {/* =========================================================================
            SECTION 1: PRODUCT HERO & SPECIFICATIONS (2 COLUMN GRID)
           ========================================================================= */}
        <section className="w-full border-b border-black dark:border-zinc-800">
          <div className="w-[1920px] max-w-full mx-auto grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-black dark:divide-zinc-800">
            
            {/* LEFT COLUMN: IMAGE GALLERY SLIDER */}
            <div className="relative p-8 lg:p-16 bg-white dark:bg-zinc-900 flex flex-col items-center justify-between min-h-[500px] lg:min-h-[700px]">
              {/* Main Product Image */}
              <div className="relative w-full h-[350px] sm:h-[450px] my-auto flex items-center justify-center">
                <Image
                  src={product.images[currentImageIdx]}
                  alt={product.name}
                  fill
                  className="object-contain p-4 transition-all duration-300"
                  priority
                />
              </div>

              {/* Slider Controls Bar */}
              <div className="w-full flex items-center justify-between pt-8 border-t border-black/10 dark:border-white/10">
                {/* Arrow Controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrevImage}
                    className="w-12 h-12 border border-black dark:border-white flex items-center justify-center bg-white dark:bg-zinc-800 hover:bg-[#C5FA1F] hover:text-black transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="w-12 h-12 border border-black dark:border-white flex items-center justify-center bg-white dark:bg-zinc-800 hover:bg-[#C5FA1F] hover:text-black transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </div>

                {/* Dots Indicator */}
                <div className="flex items-center gap-2">
                  {product.images.map((_: any, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIdx(idx)}
                      className={`w-3 h-3 rounded-full transition-all cursor-pointer ${
                        currentImageIdx === idx
                          ? "bg-black dark:bg-white scale-125"
                          : "bg-zinc-300 dark:bg-zinc-700"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: PRODUCT INFO & SPECS */}
            <div className="p-8 lg:p-16 bg-white dark:bg-zinc-900 space-y-8 flex flex-col justify-between">
              <div className="space-y-6">
                {/* Discount Badge */}
                {product.discount && (
                  <span className="inline-block px-3 py-1 bg-[#E01715] text-white text-xs font-bold uppercase tracking-wider">
                    {product.discount}
                  </span>
                )}

                {/* Title */}
                <h1 className="text-[32px] sm:text-[48px] font-bold tracking-tight leading-tight">
                  {product.name}
                </h1>

                {/* Rating & Reviews */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-amber-500 text-amber-500" />
                    ))}
                  </div>
                  <span className="text-[16px] font-medium text-zinc-600 dark:text-zinc-400">
                    ({product.reviewsCount} đánh giá)
                  </span>
                </div>

                {/* Price Display */}
                <div className="flex items-baseline gap-4">
                  <span className="text-[36px] sm:text-[44px] font-extrabold text-black dark:text-white">
                    {formatCurrency(product.price)}
                  </span>
                  {product.originalPrice && (
                    <span className="text-[20px] line-through text-zinc-400 font-medium">
                      {formatCurrency(product.originalPrice)}
                    </span>
                  )}
                </div>

                {/* Specifications Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 py-6 border-y border-black/10 dark:border-white/10 text-[16px]">
                  <div className="flex items-center justify-between sm:justify-start gap-2">
                    <span className="text-zinc-500 dark:text-zinc-400 font-medium">Brand Name:</span>
                    <span className="font-bold">{product.brand}</span>
                  </div>
                  <div className="flex items-center justify-between sm:justify-start gap-2">
                    <span className="text-zinc-500 dark:text-zinc-400 font-medium">Model:</span>
                    <span className="font-bold">{product.model}</span>
                  </div>
                  <div className="flex items-center justify-between sm:justify-start gap-2">
                    <span className="text-zinc-500 dark:text-zinc-400 font-medium">Dimensions:</span>
                    <span className="font-bold">{product.dimensions}</span>
                  </div>
                  <div className="flex items-center justify-between sm:justify-start gap-2">
                    <span className="text-zinc-500 dark:text-zinc-400 font-medium">Size:</span>
                    <span className="font-bold">{product.size}</span>
                  </div>
                  <div className="flex items-center justify-between sm:justify-start gap-2">
                    <span className="text-zinc-500 dark:text-zinc-400 font-medium">Weight:</span>
                    <span className="font-bold">{product.weight}</span>
                  </div>
                  <div className="flex items-center justify-between sm:justify-start gap-2">
                    <span className="text-zinc-500 dark:text-zinc-400 font-medium">Total Weight:</span>
                    <span className="font-bold">{product.totalWeight}</span>
                  </div>
                </div>

                {/* Product Description */}
                <p className="text-[16px] leading-relaxed text-zinc-700 dark:text-zinc-300 font-normal">
                  {product.description}
                </p>
              </div>

              {/* Add to Cart Button */}
              <div className="pt-6">
                <button
                  onClick={handleAddToCart}
                  className={`w-full h-[58px] text-[20px] font-bold border border-black flex items-center justify-center gap-3 transition-all cursor-pointer ${
                    addedToCart
                      ? "bg-[#1CCA00] text-white"
                      : "bg-black text-white dark:bg-white dark:text-black hover:bg-[#C5FA1F] hover:text-black"
                  }`}
                >
                  {addedToCart ? (
                    <>
                      <CheckCircle2 className="w-6 h-6" /> Đã Thêm Vào Giỏ Hàng!
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-6 h-6" /> Thêm vào giỏ hàng
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </section>

        {/* =========================================================================
            SECTION 2: MARQUEE TICKER BANNER (#C5FA1F)
           ========================================================================= */}
        <section className="w-full bg-[#C5FA1F] text-black py-4 overflow-hidden border-b border-black">
          <div className="whitespace-nowrap flex items-center gap-12 animate-marquee font-bold text-[18px] sm:text-[20px]">
            {[...Array(6)].map((_, i) => (
              <React.Fragment key={i}>
                <span>Miễn phí vận chuyển cho đơn hàng trên 1 triệu</span>
                <span className="w-2.5 h-2.5 rounded-full bg-black inline-block" />
              </React.Fragment>
            ))}
          </div>
        </section>

        {/* =========================================================================
            SECTION 3: RELATED PRODUCTS (Có thể bạn sẽ thích)
           ========================================================================= */}
        <section className="w-full border-b border-black dark:border-zinc-800">
          <div className="w-[1920px] max-w-full mx-auto p-8 lg:p-12 space-y-8">
            <h2 className="text-[36px] sm:text-[48px] font-bold tracking-tight">
              Có thể bạn sẽ thích
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-black dark:border-zinc-800 divide-y sm:divide-y-0 sm:divide-x divide-black dark:divide-zinc-800">
              {RELATED_PRODUCTS.map((relProd) => (
                <Link
                  key={relProd.id}
                  href={`/product/${relProd.id}`}
                  className="group relative flex flex-col justify-between bg-white dark:bg-zinc-900 p-6 lg:p-8 hover:bg-[#F9F9F9] dark:hover:bg-zinc-800/80 transition-all duration-300"
                >
                  <div className="flex items-center justify-between z-10">
                    <span className="px-3 py-1 bg-[#623CEA] text-white text-xs font-bold uppercase">
                      {relProd.status}
                    </span>
                    {relProd.discount && (
                      <span className="px-3 py-1 bg-[#E01715] text-white text-xs font-bold uppercase">
                        {relProd.discount}
                      </span>
                    )}
                  </div>

                  <div className="relative w-full aspect-square my-6 overflow-hidden flex items-center justify-center">
                    <Image
                      src={relProd.image}
                      alt={relProd.name}
                      fill
                      className="object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                  <div className="space-y-2 pt-4 border-t border-black/10 dark:border-white/10">
                    <h3 className="text-[20px] font-bold group-hover:text-primary transition-colors">
                      {relProd.name}
                    </h3>
                    <div className="flex items-baseline gap-3">
                      <span className="text-[20px] font-extrabold">{relProd.price}</span>
                      {relProd.originalPrice && (
                        <span className="text-xs line-through text-zinc-400">{relProd.originalPrice}</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

      </div>
    </PublicLayout>
  );
}
