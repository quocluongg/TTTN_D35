"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { toast } from "react-hot-toast";

export default function Footer() {
  const [email, setEmail] = useState("");

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    toast.success("Cảm ơn bạn đã đăng ký nhận thông tin từ ShopWise!");
    setEmail("");
  };

  return (
    <footer className="w-full bg-[#F2F2F2] dark:bg-zinc-900 border-t border-black dark:border-zinc-800 text-black dark:text-white transition-colors duration-300">
      {/* 1. NEWSLETTER BANNER (GREEN ACCENT #C5FA1F) */}
      <div className="w-[1920px] max-w-full mx-auto min-h-[140px] lg:min-h-[160px] bg-[#C5FA1F] border-b border-black text-black px-6 lg:px-12 py-8 flex flex-col lg:flex-row justify-between items-center gap-6">
        <h3 className="text-[20px] md:text-[24px] lg:text-[28px] font-medium tracking-tight max-w-2xl text-center lg:text-left">
          Hãy là người đầu tiên biết về các sản phẩm mới và ưu đãi độc quyền
        </h3>

        <form onSubmit={handleSubscribe} className="flex items-center gap-3 w-full lg:w-auto max-w-lg">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Nhập Email của bạn"
            required
            className="flex-1 lg:w-[320px] h-[56px] px-6 text-[18px] bg-white border border-black text-black placeholder:text-zinc-500 focus:outline-none"
          />
          <button
            type="submit"
            className="h-[56px] px-8 bg-[#F2F2F2] hover:bg-white border border-black text-black text-[20px] font-medium flex items-center gap-2 transition-colors cursor-pointer shrink-0"
          >
            Đăng ký
            <ArrowUpRight className="w-5 h-5" />
          </button>
        </form>
      </div>

      {/* 2. LINKS ROW (4 ARCHITECTURAL COLUMNS) */}
      <div className="w-[1920px] max-w-full mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-b border-black dark:border-zinc-800">
        {/* Column 1: Mua sắm */}
        <div className="p-8 lg:p-12 border-b sm:border-b-0 sm:border-r border-black dark:border-zinc-800 space-y-6">
          <h4 className="text-[#969696] text-[24px] font-medium">Mua sắm</h4>
          <ul className="space-y-4 text-[20px] lg:text-[24px] font-medium">
            <li><Link href="/shop" className="hover:underline">Tất cả</Link></li>
            <li><Link href="/shop/smartphones" className="hover:underline">Điện thoại thông minh</Link></li>
            <li><Link href="/shop/laptops" className="hover:underline">Máy tính xách tay</Link></li>
            <li><Link href="/shop/tablets" className="hover:underline">Máy tính bảng</Link></li>
            <li><Link href="/shop/accessories" className="hover:underline">Phụ kiện</Link></li>
          </ul>
        </div>

        {/* Column 2: Thông tin */}
        <div className="p-8 lg:p-12 border-b sm:border-b-0 lg:border-r border-black dark:border-zinc-800 space-y-6">
          <h4 className="text-[#969696] text-[24px] font-medium">Thông tin</h4>
          <ul className="space-y-4 text-[20px] lg:text-[24px] font-medium">
            <li><Link href="/news" className="hover:underline">Tin tức</Link></li>
            <li><Link href="/about" className="hover:underline">Giới thiệu</Link></li>
            <li><Link href="/faq" className="hover:underline">Câu hỏi thường gặp</Link></li>
            <li><Link href="/contact" className="hover:underline">Liên hệ</Link></li>
            <li><Link href="/login" className="hover:underline">Đăng nhập</Link></li>
          </ul>
        </div>

        {/* Column 3: Pháp lý */}
        <div className="p-8 lg:p-12 border-b sm:border-b-0 sm:border-r border-black dark:border-zinc-800 space-y-6">
          <h4 className="text-[#969696] text-[24px] font-medium">Pháp lý</h4>
          <ul className="space-y-4 text-[20px] lg:text-[24px] font-medium">
            <li><Link href="/privacy" className="hover:underline">Chính sách bảo mật</Link></li>
            <li><Link href="/terms" className="hover:underline">Điều khoản dịch vụ</Link></li>
            <li><Link href="/cookies" className="hover:underline">Cài đặt cookie</Link></li>
            <li><Link href="/shipping" className="hover:underline">Chính sách vận chuyển</Link></li>
            <li><Link href="/returns" className="hover:underline">Bắt đầu trả hàng</Link></li>
          </ul>
        </div>

        {/* Column 4: Mạng xã hội */}
        <div className="p-8 lg:p-12 space-y-6">
          <h4 className="text-[#969696] text-[24px] font-medium">Mạng xã hội</h4>
          <ul className="space-y-4 text-[20px] lg:text-[24px] font-medium">
            <li><a href="https://facebook.com" target="_blank" rel="noreferrer" className="hover:underline">Facebook</a></li>
            <li><a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:underline">Instagram</a></li>
            <li><a href="https://threads.net" target="_blank" rel="noreferrer" className="hover:underline">Threads</a></li>
            <li><a href="https://x.com" target="_blank" rel="noreferrer" className="hover:underline">X (Twitter)</a></li>
            <li><a href="https://tiktok.com" target="_blank" rel="noreferrer" className="hover:underline">TikTok</a></li>
          </ul>
        </div>
      </div>

      {/* 3. BOTTOM BAR WITH COPYRIGHT & GIANT LOGO */}
      <div className="w-[1920px] max-w-full mx-auto p-8 lg:p-12 space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
          {/* Payment Method Badges */}
          <div className="flex flex-wrap items-center gap-3">
            {["VISA", "Mastercard", "Apple Pay", "Google Pay", "PayPal", "MoMo", "VNPay"].map((pay, i) => (
              <span key={i} className="px-3 py-1.5 border border-black dark:border-zinc-700 text-xs font-semibold uppercase tracking-wider bg-white dark:bg-zinc-800 text-black dark:text-white">
                {pay}
              </span>
            ))}
          </div>

          <p className="text-[16px] font-medium text-black dark:text-zinc-400">
            © ShopWise 2026. Tất cả các quyền được bảo lưu.
          </p>
        </div>

        {/* GIANT BRAND TYPOGRAPHY LOGO */}
        <div className="w-full pt-8 flex justify-center items-center overflow-hidden">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 173 28" fill="none" className="w-full h-auto max-h-[140px] text-black dark:text-white">
            <path d="M10.1851 28C8.15298 28 6.38853 27.6836 4.89179 27.0508C3.40721 26.4059 2.24511 25.4872 1.40548 24.2947C0.565841 23.1021 0.097349 21.6845 0 20.0417H4.12516C4.21034 21.0274 4.52673 21.8488 5.07432 22.5059C5.63407 23.1508 6.35811 23.6315 7.24641 23.9478C8.13472 24.2642 9.10821 24.4224 10.1669 24.4224C11.3229 24.4224 12.3572 24.2399 13.2699 23.8748C14.1825 23.5098 14.8944 22.9987 15.4055 22.3416C15.9287 21.6723 16.1904 20.8935 16.1904 20.0052C16.1904 19.2021 15.9591 18.545 15.4967 18.0339C15.0465 17.5228 14.432 17.103 13.6532 16.7744C12.8744 16.4337 11.9983 16.1356 11.0248 15.8801L7.83051 15.0039C5.64016 14.4198 3.91221 13.5498 2.64668 12.3937C1.38114 11.2256 0.74837 9.69839 0.74837 7.81226C0.74837 6.2425 1.16819 4.87353 2.00782 3.70535C2.85963 2.53716 4.00956 1.6306 5.45763 0.985658C6.91786 0.328553 8.55454 0 10.3677 0C12.2173 0 13.8418 0.328553 15.2412 0.985658C16.6528 1.6306 17.7662 2.5189 18.5815 3.65059C19.409 4.7701 19.8409 6.05389 19.8774 7.50196H15.8983C15.7523 6.24859 15.1682 5.2751 14.146 4.58149C13.136 3.88787 11.8462 3.54107 10.2764 3.54107C9.18123 3.54107 8.2199 3.71751 7.39244 4.0704C6.57714 4.41113 5.94437 4.8857 5.49413 5.49413C5.05606 6.10256 4.83703 6.80226 4.83703 7.59322C4.83703 8.44502 5.09865 9.13864 5.6219 9.67406C6.15732 10.2095 6.80226 10.6354 7.55671 10.9518C8.32334 11.256 9.05954 11.5054 9.76532 11.7001L12.412 12.412C13.276 12.631 14.1643 12.9231 15.0769 13.2881C15.9896 13.6532 16.8353 14.1339 17.6141 14.7301C18.405 15.3142 19.0378 16.0443 19.5124 16.9205C19.9991 17.7844 20.2425 18.8309 20.2425 20.06C20.2425 21.5811 19.847 22.9439 19.0561 24.1486C18.2651 25.3412 17.1213 26.2842 15.6245 26.9778C14.1278 27.6593 12.3146 28 10.1851 28Z" fill="currentColor" />
            <path d="M22.0693 27.5619V0.365059H26.1762V12.193H39.7198V0.365059H43.8268V27.5619H39.7198V15.7158H26.1762V27.5619H22.0693Z" fill="currentColor" />
            <path d="M58.102 27.927C55.7656 27.927 53.6726 27.3672 51.823 26.2477C49.9734 25.1282 48.5131 23.528 47.4423 21.4472C46.3715 19.3542 45.836 16.8657 45.836 13.9817C45.836 11.0734 46.3715 8.57888 47.4423 6.49804C48.5131 4.40504 49.9734 2.79878 51.823 1.67927C53.6726 0.559757 55.7656 0 58.102 0C60.4627 0 62.5618 0.559757 64.3993 1.67927C66.2367 2.79878 67.6848 4.40504 68.7435 6.49804C69.8143 8.57888 70.3497 11.0734 70.3497 13.9817C70.3497 16.8779 69.8143 19.3664 68.7435 21.4472C67.6848 23.528 66.2367 25.1282 64.3993 26.2477C62.5618 27.3672 60.4627 27.927 58.102 27.927ZM58.102 24.1851C59.6718 24.1851 61.0712 23.7957 62.3002 23.0169C63.5292 22.2382 64.4966 21.0882 65.2024 19.5671C65.9203 18.0461 66.2793 16.1843 66.2793 13.9817C66.2793 11.7671 65.9203 9.89917 65.2024 8.3781C64.4966 6.84485 63.5292 5.68883 62.3002 4.91004C61.0712 4.13125 59.6718 3.74185 58.102 3.74185C56.5444 3.74185 55.145 4.13125 53.9038 4.91004C52.6748 5.68883 51.7013 6.84485 50.9834 8.3781C50.2654 9.89917 49.9064 11.7671 49.9064 13.9817C49.9064 16.1843 50.2654 18.0461 50.9834 19.5671C51.7013 21.0882 52.6748 22.2382 53.9038 23.0169C55.145 23.7957 56.5444 24.1851 58.102 24.1851Z" fill="currentColor" />
            <path d="M72.3773 27.5619V0.365059H82.0878C84.193 0.365059 85.9392 0.754455 87.3264 1.53325C88.7136 2.29987 89.7541 3.35246 90.4477 4.691C91.1413 6.01738 91.4881 7.51412 91.4881 9.18123C91.4881 10.8483 91.1413 12.3512 90.4477 13.6897C89.7541 15.0161 88.7076 16.0687 87.3082 16.8475C85.9209 17.6141 84.1687 17.9974 82.0513 17.9974H75.4072V14.5293H81.668C83.0187 14.5293 84.1078 14.2981 84.9353 13.8357C85.7749 13.3733 86.3833 12.7405 86.7606 11.9374C87.15 11.1221 87.3447 10.2034 87.3447 9.18123C87.3447 8.14689 87.15 7.23425 86.7606 6.44329C86.3833 5.64016 85.7749 5.01347 84.9353 4.56323C84.0956 4.11299 83.0005 3.88787 81.6498 3.88787H76.4842V27.5619H72.3773Z" fill="currentColor" />
            <path d="M98.5899 27.5619L91.0697 0.365059H95.3774L100.671 21.4289H100.926L106.439 0.365059H110.71L116.204 21.4472H116.478L121.753 0.365059H126.097L118.522 27.5619H114.397L108.684 7.20991H108.465L102.752 27.5619H98.5899Z" fill="currentColor" />
            <path d="M130.954 0.365059V27.5619H126.847V0.365059H130.954Z" fill="currentColor" />
            <path d="M142.966 28C140.934 28 139.169 27.6836 137.672 27.0508C136.188 26.4059 135.026 25.4872 134.186 24.2947C133.346 23.1021 132.878 21.6845 132.781 20.0417H136.906C136.991 21.0274 137.307 21.8488 137.855 22.5059C138.415 23.1508 139.139 23.6315 140.027 23.9478C140.915 24.2642 141.889 24.4224 142.947 24.4224C144.104 24.4224 145.138 24.2399 146.05 23.8748C146.963 23.5098 147.675 22.9987 148.186 22.3416C148.709 21.6723 148.971 20.8935 148.971 20.0052C148.971 19.2021 148.74 18.545 148.277 18.0339C147.827 17.5228 147.213 17.103 146.434 16.7744C145.655 16.4337 144.779 16.1356 143.805 15.8801L140.611 15.0039C138.421 14.4198 136.693 13.5498 135.427 12.3937C134.162 11.2256 133.529 9.69839 133.529 7.81226C133.529 6.2425 133.949 4.87353 134.788 3.70535C135.64 2.53716 136.79 1.6306 138.238 0.985658C139.698 0.328553 141.335 0 143.148 0C144.998 0 146.622 0.328553 148.022 0.985658C149.433 1.6306 150.547 2.5189 151.362 3.65059C152.19 4.7701 152.622 6.05389 152.658 7.50196H148.679C148.533 6.24859 147.949 5.2751 146.927 4.58149C145.917 3.88787 144.627 3.54107 143.057 3.54107C141.962 3.54107 141.001 3.71751 140.173 4.0704C139.358 4.41113 138.725 4.8857 138.275 5.49413C137.837 6.10256 137.618 6.80226 137.618 7.59322C137.618 8.44502 137.879 9.13864 138.402 9.67406C138.938 10.2095 139.583 10.6354 140.337 10.9518C141.104 11.256 141.84 11.5054 142.546 11.7001L145.193 12.412C146.057 12.631 146.945 12.9231 147.858 13.2881C148.77 13.6532 149.616 14.1339 150.395 14.7301C151.186 15.3142 151.818 16.0443 152.293 16.9205C152.78 17.7844 153.023 18.8309 153.023 20.06C153.023 21.5811 152.628 22.9439 151.837 24.1486C151.046 25.3412 149.902 26.2842 148.405 26.9778C146.908 27.6593 145.095 28 142.966 28Z" fill="currentColor" />
            <path d="M154.85 27.5619V0.365059H171.916V3.88787H158.957V12.0834H171.004V15.588H158.957V24.0391H172.044V27.5619H154.85Z" fill="currentColor" />
          </svg>
        </div>
      </div>
    </footer>
  );
}
