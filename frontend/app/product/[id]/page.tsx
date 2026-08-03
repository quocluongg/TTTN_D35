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

import { useQuery } from "@tanstack/react-query";
import { productService, ProductVariant } from "@/services/productServices";
import { ShieldCheck, Tag, Cpu, HardDrive } from "lucide-react";

export default function ProductDetailPage() {
  const params = useParams();
  const slugOrId = (params.id as string) || "";

  // TanStack Query: Fetch detail product from backend
  const { data: detailRes, isLoading, isError } = useQuery({
    queryKey: ["product-detail", slugOrId],
    queryFn: () => productService.getProductBySlugOrId(slugOrId),
    enabled: !!slugOrId,
  });

  // TanStack Query: Fetch related products from backend
  const { data: relatedRes } = useQuery({
    queryKey: ["related-products", detailRes?.data?.brand],
    queryFn: () => productService.getProducts({ brand: detailRes?.data?.brand, size: 5 }),
    enabled: !!detailRes?.data?.brand,
  });

  const product = detailRes?.data;
  const relatedProducts = relatedRes?.data?.items || relatedRes?.data?.content || [];

  // Selected Variant State
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);

  // Set default variant when product loads
  React.useEffect(() => {
    if (product?.variants && product.variants.length > 0) {
      setSelectedVariant(product.variants[0]);
    }
  }, [product]);

  const galleryImages = React.useMemo(() => {
    const list: string[] = [];
    if (selectedVariant?.image) {
      list.push(selectedVariant.image);
    }
    if (product?.thumbnail && !list.includes(product.thumbnail)) {
      list.push(product.thumbnail);
    }
    if (product?.images && product.images.length > 0) {
      product.images.forEach((img) => {
        if (img.url && !list.includes(img.url)) list.push(img.url);
      });
    }
    return list.length > 0
      ? list
      : ["https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/Laptop_d170e53d32.png"];
  }, [product, selectedVariant]);

  const handlePrevImage = () => {
    setCurrentImageIdx((prev) => (prev === 0 ? galleryImages.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIdx((prev) => (prev === galleryImages.length - 1 ? 0 : prev + 1));
  };

  const handleAddToCart = () => {
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2500);
  };

  const formatCurrency = (val?: number) => {
    if (!val) return "Liên hệ";
    return new Intl.NumberFormat("vi-VN").format(val) + "đ";
  };

  if (isLoading) {
    return (
      <PublicLayout fullWidth>
        <div className="p-32 text-center text-xl font-bold text-black dark:text-white bg-[#F2F2F2] dark:bg-zinc-950">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-black dark:border-white border-t-transparent mb-4"></div>
          <p>Đang tải thông tin chi tiết sản phẩm...</p>
        </div>
      </PublicLayout>
    );
  }

  if (isError || !product) {
    return (
      <PublicLayout fullWidth>
        <div className="p-24 text-center space-y-4 bg-[#F2F2F2] dark:bg-zinc-950 text-black dark:text-white">
          <h2 className="text-3xl font-bold">Không tìm thấy sản phẩm</h2>
          <p className="text-zinc-500">Sản phẩm này có thể đã bị ngưng kinh doanh hoặc đường dẫn không khả dụng.</p>
          <Link
            href="/shop"
            className="inline-block px-6 py-3 bg-black text-white dark:bg-white dark:text-black font-semibold text-sm hover:bg-zinc-800 transition-colors"
          >
            Quay lại Cửa Hàng
          </Link>
        </div>
      </PublicLayout>
    );
  }

  const currentPrice = selectedVariant?.price || product.variants?.[0]?.price;

  return (
    <PublicLayout fullWidth>
      <div className="w-full bg-[#F2F2F2] dark:bg-zinc-950 text-black dark:text-white transition-colors duration-300">
        
        {/* BREADCRUMB */}
        {product.categoryBreadcrumb && product.categoryBreadcrumb.length > 0 && (
          <div className="w-full border-b border-black/10 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-8 py-3">
            <div className="w-[1920px] max-w-full mx-auto flex items-center gap-2 text-xs font-semibold text-zinc-500">
              <Link href="/" className="hover:text-black dark:hover:text-white">Trang chủ</Link>
              <span>/</span>
              <Link href="/shop" className="hover:text-black dark:hover:text-white">Cửa hàng</Link>
              {product.categoryBreadcrumb.map((cat) => (
                <React.Fragment key={cat.id}>
                  <span>/</span>
                  <Link href={`/shop?category=${cat.slug}`} className="hover:text-black dark:hover:text-white">
                    {cat.name}
                  </Link>
                </React.Fragment>
              ))}
              <span>/</span>
              <span className="text-black dark:text-white font-bold">{product.name}</span>
            </div>
          </div>
        )}

        {/* =========================================================================
            SECTION 1: PRODUCT HERO & VARIANTS
           ========================================================================= */}
        <section className="w-full border-b border-black dark:border-zinc-800">
          <div className="w-[1920px] max-w-full mx-auto grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-black dark:divide-zinc-800">
            
            {/* LEFT COLUMN: IMAGE GALLERY SLIDER */}
            <div className="relative p-8 lg:p-12 bg-white dark:bg-zinc-900 flex flex-col justify-between min-h-[500px] lg:min-h-[650px]">
              {/* Brand Badge */}
              <div className="flex items-center justify-between w-full z-10">
                {product.brand && (
                  <span className="px-3 py-1 bg-black text-white dark:bg-white dark:text-black text-xs font-bold uppercase tracking-wider">
                    {product.brand}
                  </span>
                )}
                {product.origin && (
                  <span className="text-xs font-semibold text-zinc-500">Xuất xứ: {product.origin}</span>
                )}
              </div>

              {/* Main Image */}
              <div className="relative w-full h-[350px] sm:h-[420px] my-auto flex items-center justify-center">
                <Image
                  src={galleryImages[currentImageIdx]}
                  alt={product.name}
                  fill
                  className="object-contain p-4 transition-all duration-300"
                  priority
                />
              </div>

              {/* Gallery Thumbnails & Arrows */}
              <div className="w-full space-y-4 pt-6 border-t border-black/10 dark:border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePrevImage}
                      className="w-10 h-10 border border-black dark:border-white flex items-center justify-center bg-white dark:bg-zinc-800 hover:bg-[#C5FA1F] hover:text-black transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleNextImage}
                      className="w-10 h-10 border border-black dark:border-white flex items-center justify-center bg-white dark:bg-zinc-800 hover:bg-[#C5FA1F] hover:text-black transition-colors cursor-pointer"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Thumbnail List */}
                  <div className="flex items-center gap-2 overflow-x-auto">
                    {galleryImages.map((imgUrl, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentImageIdx(idx)}
                        className={`relative w-12 h-12 border transition-all overflow-hidden ${
                          currentImageIdx === idx
                            ? "border-black dark:border-white ring-2 ring-indigo-500"
                            : "border-zinc-200 dark:border-zinc-700 opacity-60 hover:opacity-100"
                        }`}
                      >
                        <Image src={imgUrl} alt="Thumbnail" fill className="object-contain p-1" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: PRODUCT INFO & VARIANTS */}
            <div className="p-8 lg:p-12 bg-white dark:bg-zinc-900 flex flex-col justify-between space-y-8">
              <div className="space-y-6">
                
                {/* Title */}
                <h1 className="text-[28px] sm:text-[40px] font-bold tracking-tight leading-tight">
                  {product.name}
                </h1>

                {/* Rating & Reviews */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-amber-500 text-amber-500" />
                    ))}
                  </div>
                  <span className="text-[16px] font-semibold text-black dark:text-white">
                    {product.ratingAvg ? Number(product.ratingAvg).toFixed(1) : "5.0"}
                  </span>
                  <span className="text-zinc-500">({product.reviewCount || 0} đánh giá)</span>
                </div>

                {/* Price Display */}
                <div className="p-4 bg-[#F2F2F2] dark:bg-zinc-800/60 border border-black/10 dark:border-white/10 flex items-baseline justify-between">
                  <div>
                    <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider block">Giá sản phẩm</span>
                    <span className="text-[32px] sm:text-[40px] font-extrabold text-indigo-700 dark:text-indigo-400">
                      {formatCurrency(currentPrice)}
                    </span>
                  </div>
                  {product.warrantyMonths && (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-full border border-emerald-500/30">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Bảo hành {product.warrantyMonths} tháng</span>
                    </div>
                  )}
                </div>

                {/* VARIANTS SELECTOR */}
                {product.variants && product.variants.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <label className="text-sm font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 flex items-center justify-between">
                      <span>Tùy chọn cấu hình / Phiên bản:</span>
                      <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                        {selectedVariant?.stock ? `Còn ${selectedVariant.stock} sản phẩm` : "Hết hàng"}
                      </span>
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {product.variants.map((v) => (
                        <button
                          key={v.id}
                          onClick={() => setSelectedVariant(v)}
                          className={`p-3 border text-left flex flex-col justify-between transition-all cursor-pointer ${
                            selectedVariant?.id === v.id
                              ? "bg-black text-white border-black dark:bg-white dark:text-black font-bold"
                              : "bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 hover:border-black"
                          }`}
                        >
                          <span className="text-sm font-bold">{v.variantName || v.sku}</span>
                          <span className="text-xs opacity-80 mt-1">{formatCurrency(v.price)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* SPECIFICATION ATTRIBUTES */}
                {selectedVariant?.attributes && Object.keys(selectedVariant.attributes).length > 0 && (
                  <div className="p-4 border border-black/10 dark:border-zinc-800 bg-[#F9F9F9] dark:bg-zinc-800/40 space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Thông số cấu hình chọn</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {Object.entries(selectedVariant.attributes).map(([key, val]) => (
                        <div key={key} className="flex items-center gap-2">
                          <span className="font-semibold text-zinc-500">{key}:</span>
                          <span className="font-bold text-black dark:text-white">{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Add to Cart Action */}
              <div className="pt-4">
                <button
                  onClick={handleAddToCart}
                  disabled={selectedVariant?.stock === 0}
                  className={`w-full h-[58px] text-[18px] sm:text-[20px] font-bold border border-black flex items-center justify-center gap-3 transition-all cursor-pointer ${
                    selectedVariant?.stock === 0
                      ? "bg-zinc-300 text-zinc-500 border-zinc-300 cursor-not-allowed"
                      : addedToCart
                      ? "bg-[#1CCA00] text-white"
                      : "bg-black text-white dark:bg-white dark:text-black hover:bg-[#C5FA1F] hover:text-black"
                  }`}
                >
                  {selectedVariant?.stock === 0 ? (
                    "Tạm Hết Hàng"
                  ) : addedToCart ? (
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
            SECTION 2: DESCRIPTION & CUSTOM TABS
           ========================================================================= */}
        <section className="w-full border-b border-black dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div className="w-[1920px] max-w-full mx-auto p-8 lg:p-12 space-y-6">
            <h2 className="text-[28px] font-bold tracking-tight border-b border-black/10 dark:border-white/10 pb-4">
              Mô tả & Thông tin chi tiết
            </h2>
            <div className="prose dark:prose-invert max-w-none text-zinc-700 dark:text-zinc-300 leading-relaxed space-y-4">
              {product.description ? (
                <p className="whitespace-pre-line text-base">{product.description}</p>
              ) : (
                <p className="text-zinc-500">Chưa có thông tin mô tả chi tiết cho sản phẩm này.</p>
              )}
            </div>

            {/* Custom Tabs from Backend */}
            {product.customTabs && product.customTabs.length > 0 && (
              <div className="space-y-6 pt-6 border-t border-black/10 dark:border-white/10">
                {product.customTabs.map((tab) => (
                  <div key={tab.id} className="space-y-2">
                    <h3 className="text-xl font-bold text-black dark:text-white">{tab.title}</h3>
                    <p className="text-zinc-600 dark:text-zinc-400 whitespace-pre-line">{tab.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* =========================================================================
            SECTION 3: RELATED PRODUCTS
           ========================================================================= */}
        {relatedProducts.length > 0 && (
          <section className="w-full border-b border-black dark:border-zinc-800">
            <div className="w-[1920px] max-w-full mx-auto p-8 lg:p-12 space-y-8">
              <h2 className="text-[32px] sm:text-[40px] font-bold tracking-tight">
                Sản phẩm cùng thương hiệu ({product.brand})
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {relatedProducts.map((relProd) => (
                  <Link
                    key={relProd.id}
                    href={`/product/${relProd.slug || relProd.id}`}
                    className="group flex flex-col justify-between hover:shadow-xl transition-all duration-300 border border-black/10 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg overflow-hidden"
                  >
                    <div className="relative w-full aspect-square flex items-center justify-center p-6 border-b border-black/10 dark:border-zinc-800 overflow-hidden">
                      <Image
                        src={relProd.thumbnail || "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/Laptop_d170e53d32.png"}
                        alt={relProd.name}
                        fill
                        className="object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>

                    <div className="p-5 flex flex-col justify-between text-black dark:text-white flex-1 gap-3">
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase">
                          {relProd.categoryName}
                        </span>
                        <h3 className="text-base font-bold line-clamp-2 group-hover:text-indigo-600 transition-colors">
                          {relProd.name}
                        </h3>
                      </div>
                      <div className="pt-2 border-t border-black/10 dark:border-zinc-800">
                        <span className="text-sm text-zinc-500 font-medium">Giá từ: </span>
                        <span className="text-lg font-bold text-indigo-700 dark:text-indigo-400">
                          {formatCurrency(relProd.priceFrom)}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

      </div>
    </PublicLayout>
  );
}
