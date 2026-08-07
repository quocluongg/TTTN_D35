"use client";

import React from "react";
import Link from "next/link";
import {
  Shield,
  Truck,
  RefreshCw,
  ShoppingCart,
  CreditCard,
  Package,
  Zap,
  Award,
  CheckCircle,
  Star,
  ArrowUpRight,
} from "lucide-react";
import PublicLayout from "@/shared/layouts/PublicLayout";

const BRANDS_LIST = [
  { name: "Kyoritsu", logo: "KYORITSU", count: "120+ sản phẩm", description: "Thương hiệu thiết bị đo hàng đầu Nhật Bản" },
  { name: "Hioki", logo: "HIOKI", count: "95+ sản phẩm", description: "Thiết bị đo công nghiệp cao cấp từ Nhật" },
  { name: "Fluke", logo: "FLUKE", count: "150+ sản phẩm", description: "Chuẩn mực đo lường an toàn thế giới" },
  { name: "Uni-T", logo: "UNI-T", count: "210+ sản phẩm", description: "Đồng hồ đo & thiết bị đo phổ thông chất lượng" },
  { name: "Sanwa", logo: "SANWA", count: "80+ sản phẩm", description: "Đồng hồ vạn năng truyền thống siêu bền" },
  { name: "Testo", logo: "TESTO", count: "65+ sản phẩm", description: "Chuyên gia đo nhiệt độ, môi trường từ Đức" },
];

export default function BrandsPage() {
  return (
    <PublicLayout fullWidth>
    <div className="min-h-screen bg-[#F2F2F2] dark:bg-zinc-900 text-black dark:text-white">
      {/* ===== HERO ARCHITECTURAL GRID SECTION ===== */}
      <section className="border-b border-black dark:border-zinc-800 bg-[#C5C5C5] dark:bg-zinc-800 p-8 lg:p-16">
        <div className="max-w-[1920px] mx-auto text-left">
          <div className="inline-flex items-center gap-2 bg-black text-white dark:bg-white dark:text-black px-3 py-1 text-xs font-mono tracking-widest uppercase mb-6 rounded-none">
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Thương Hiệu Chính Hãng</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-medium tracking-tight uppercase leading-none mb-6">
            Thương Hiệu & <br />
            Điểm Tựa Kỹ Thuật
          </h1>

          <p className="text-lg md:text-xl text-neutral-800 dark:text-zinc-300 max-w-3xl leading-relaxed mb-8">
            Đo chuẩn xác, Làm an toàn — Chuyên gia thiết bị đo, Uy tín tạo niềm tin. Chúng tôi phân phối trực tiếp từ các thương hiệu hàng đầu thế giới.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border-t border-l border-black dark:border-zinc-700 bg-[#F2F2F2] dark:bg-zinc-900">
            {[
              { value: "100%", label: "Cam Kết Chính Hãng" },
              { value: "10X", label: "Đền Bù Nếu Hàng Giả" },
              { value: "24/7", label: "Tư Vấn Kỹ Thuật" },
              { value: "1 ĐỔI 1", label: "Bảo Hành Siêu Tốc" },
            ].map((stat) => (
              <div key={stat.label} className="p-6 border-r border-b border-black dark:border-zinc-700 text-left">
                <p className="text-3xl lg:text-4xl font-medium tracking-tight text-black dark:text-white">
                  {stat.value}
                </p>
                <p className="text-xs font-mono uppercase text-neutral-600 dark:text-zinc-400 mt-2">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== BRANDS CATALOG GRID ===== */}
      <section className="p-8 lg:p-16 border-b border-black dark:border-zinc-800">
        <div className="max-w-[1920px] mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 pb-4 border-b border-black dark:border-zinc-800">
            <div>
              <h2 className="text-3xl font-medium tracking-tight uppercase">Danh Mục Thương Hiệu</h2>
              <p className="text-sm text-neutral-600 dark:text-zinc-400 mt-1">Lựa chọn sản phẩm theo hãng sản xuất uy tín</p>
            </div>
            <span className="text-xs font-mono uppercase text-neutral-500 mt-4 md:mt-0">Hiển thị {BRANDS_LIST.length} thương hiệu</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-t border-l border-black dark:border-zinc-800">
            {BRANDS_LIST.map((brand) => (
              <Link
                key={brand.name}
                href={`/shop?brand=${encodeURIComponent(brand.name)}`}
                className="group p-8 border-r border-b border-black dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:bg-[#F2F2F2] dark:hover:bg-zinc-900 transition-colors flex flex-col justify-between h-[240px]"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-2xl font-bold tracking-wider font-mono text-black dark:text-white group-hover:underline">
                      {brand.logo}
                    </span>
                    <ArrowUpRight className="w-5 h-5 text-neutral-400 group-hover:text-black dark:group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="text-xl font-medium mt-4 tracking-tight">{brand.name}</h3>
                  <p className="text-sm text-neutral-600 dark:text-zinc-400 mt-2">{brand.description}</p>
                </div>
                <span className="text-xs font-mono uppercase text-neutral-500">{brand.count}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== COMMITMENTS ===== */}
      <section className="p-8 lg:p-16 border-b border-black dark:border-zinc-800 bg-[#F2F2F2] dark:bg-zinc-900">
        <div className="max-w-[1920px] mx-auto">
          <h2 className="text-3xl font-medium tracking-tight uppercase mb-8">Cam Kết Chất Lượng</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 border-t border-l border-black dark:border-zinc-800">
            <div className="p-8 border-r border-b border-black dark:border-zinc-800 bg-white dark:bg-zinc-950">
              <Shield className="w-8 h-8 text-black dark:text-white mb-4" />
              <h3 className="text-lg font-medium tracking-tight uppercase mb-2">Cam Kết Chính Hãng</h3>
              <p className="text-sm text-neutral-600 dark:text-zinc-400 leading-relaxed">
                Đền bù gấp 10 lần giá trị sản phẩm nếu phát hiện hàng nhái. Uy tín kỹ thuật đặt lên hàng đầu.
              </p>
            </div>
            <div className="p-8 border-r border-b border-black dark:border-zinc-800 bg-white dark:bg-zinc-950">
              <Star className="w-8 h-8 text-black dark:text-white mb-4" />
              <h3 className="text-lg font-medium tracking-tight uppercase mb-2">Dịch Vụ Kỹ Thuật 5 Sao</h3>
              <p className="text-sm text-neutral-600 dark:text-zinc-400 leading-relaxed">
                Đội ngũ kỹ sư hỗ trợ tư vấn thông số, giải đáp thắc mắc và hướng dẫn vận hành 24/7.
              </p>
            </div>
            <div className="p-8 border-r border-b border-black dark:border-zinc-800 bg-white dark:bg-zinc-950">
              <CheckCircle className="w-8 h-8 text-black dark:text-white mb-4" />
              <h3 className="text-lg font-medium tracking-tight uppercase mb-2">Giá Trị Thực Từ Gốc</h3>
              <p className="text-sm text-neutral-600 dark:text-zinc-400 leading-relaxed">
                Nhập khẩu trực tiếp từ nhà sản xuất, tối ưu chi phí mang đến mức giá tốt nhất cho thợ & doanh nghiệp.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== ORDER WORKFLOW ===== */}
      <section className="p-8 lg:p-16">
        <div className="max-w-[1920px] mx-auto text-center">
          <h2 className="text-3xl font-medium tracking-tight uppercase mb-3">Quy Trình Mua Sắm Dễ Dàng</h2>
          <p className="text-neutral-600 dark:text-zinc-400 text-sm mb-12">Chỉ với 3 bước đơn giản</p>

          <div className="grid grid-cols-1 md:grid-cols-3 border-t border-l border-black dark:border-zinc-800 text-left">
            <div className="p-8 border-r border-b border-black dark:border-zinc-800 bg-white dark:bg-zinc-950">
              <div className="text-4xl font-mono font-bold text-neutral-300 dark:text-zinc-700 mb-4">01</div>
              <h3 className="text-lg font-medium uppercase mb-2">Chọn Sản Phẩm</h3>
              <p className="text-sm text-neutral-600 dark:text-zinc-400">
                Tìm kiếm thông số kỹ thuật chuẩn xác và thêm sản phẩm vào giỏ hàng.
              </p>
            </div>
            <div className="p-8 border-r border-b border-black dark:border-zinc-800 bg-white dark:bg-zinc-950">
              <div className="text-4xl font-mono font-bold text-neutral-300 dark:text-zinc-700 mb-4">02</div>
              <h3 className="text-lg font-medium uppercase mb-2">Xác Nhận & Thanh Toán</h3>
              <p className="text-sm text-neutral-600 dark:text-zinc-400">
                Nhập mã ưu đãi, chọn phương thức thanh toán linh hoạt (VNPAY, COD, chuyển khoản).
              </p>
            </div>
            <div className="p-8 border-r border-b border-black dark:border-zinc-800 bg-white dark:bg-zinc-950">
              <div className="text-4xl font-mono font-bold text-neutral-300 dark:text-zinc-700 mb-4">03</div>
              <h3 className="text-lg font-medium uppercase mb-2">Nhận Hàng & Kiểm Tra</h3>
              <p className="text-sm text-neutral-600 dark:text-zinc-400">
                Giao hàng hoả tốc, kiểm tra máy kỹ lưỡng trước khi nghiệm thu.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
    </PublicLayout>
  );
}
