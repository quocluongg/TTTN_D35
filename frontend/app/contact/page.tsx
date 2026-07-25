"use client";

import React, { useState } from "react";
import { MapPin, Phone, Mail, Send, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#F2F2F2] dark:bg-zinc-900 text-black dark:text-white pt-[60px]">
      {/* ===== HERO ARCHITECTURAL HEADER ===== */}
      <section className="border-b border-black dark:border-zinc-800 bg-[#C5C5C5] dark:bg-zinc-800 p-8 lg:p-16">
        <div className="max-w-[1920px] mx-auto">
          <div className="inline-flex items-center gap-2 bg-black text-white dark:bg-white dark:text-black px-3 py-1 text-xs font-mono tracking-widest uppercase mb-6 rounded-none">
            <MapPin className="w-3.5 h-3.5" />
            <span>Liên Hệ & Hỗ Trợ</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-medium tracking-tight uppercase leading-none mb-4">
            Liên Hệ Với Shopwise
          </h1>

          <p className="text-base md:text-lg text-neutral-800 dark:text-zinc-300 max-w-2xl leading-relaxed">
            Đội ngũ chuyên gia kỹ thuật của chúng tôi sẵn sàng giải đáp thắc mắc, tư vấn thông số và hỗ trợ mua hàng 24/7.
          </p>
        </div>
      </section>

      {/* ===== MAP & CONTACT GRID ===== */}
      <section className="p-8 lg:p-16 border-b border-black dark:border-zinc-800">
        <div className="max-w-[1920px] mx-auto space-y-12">
          {/* MAP */}
          <div className="w-full h-[400px] border border-black dark:border-zinc-800 bg-white dark:bg-zinc-950">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3918.6860264017773!2d106.62672649999999!3d10.8353222!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752bd517fb85c7%3A0x219d0aa30363d8cb!2zNjEgxJDDtG5nIEjGsG5nIFRodeG6rW4gMywgxJDDtG5nIEjGsG5nIFRodeG6rW4sIFF14bqtbiAxMiwgVGjDoG5oIHBo4buRIEjhu5MgQ2jDrSBNaW5oLCBWaWV0bmFt!5e0!3m2!1sen!2s!4v1772371183545!5m2!1sen!2s"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen={true}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full h-full grayscale hover:grayscale-0 transition-all duration-500"
            ></iframe>
          </div>

          {/* CONTACT INFO & FORM SPLIT GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-2 border-t border-l border-black dark:border-zinc-800">
            {/* LEFT: INFO */}
            <div className="p-8 lg:p-12 border-r border-b border-black dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-8">
              <div>
                <h3 className="text-2xl font-medium tracking-tight uppercase mb-6 pb-2 border-b border-black dark:border-zinc-800">
                  Hotline Hỗ Trợ Kỹ Thuật
                </h3>
                <a href="tel:0934001435" className="text-4xl font-bold tracking-tight text-black dark:text-white block hover:underline">
                  093.400.14.35
                </a>
                <p className="text-xs font-mono text-neutral-500 mt-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> 9:00 - 17:30 (Thứ 2 - Thứ 7)
                </p>
              </div>

              <div className="space-y-4 pt-4 border-t border-black/10 dark:border-zinc-800">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 shrink-0 mt-1 text-neutral-500" />
                  <div>
                    <p className="text-sm font-medium uppercase">Địa chỉ showroom:</p>
                    <p className="text-sm text-neutral-600 dark:text-zinc-400 mt-1">
                      61/9/6 Đông Hưng Thuận 03, P. Tân Hưng Thuận, Q. 12, TP. Hồ Chí Minh
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 shrink-0 text-neutral-500" />
                  <div>
                    <p className="text-sm font-medium uppercase">Email hỗ trợ:</p>
                    <a href="mailto:support@shopwise.vn" className="text-sm text-neutral-600 dark:text-zinc-400 hover:underline">
                      support@shopwise.vn
                    </a>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-black/10 dark:border-zinc-800 text-xs font-mono text-neutral-500 leading-relaxed">
                <p>Mã Số Doanh Nghiệp: 41L8037603</p>
                <p>Đơn vị chủ quản: SHOPWISE ELECTRONICS VIETNAM</p>
              </div>
            </div>

            {/* RIGHT: FORM */}
            <div className="p-8 lg:p-12 border-r border-b border-black dark:border-zinc-800 bg-[#F2F2F2] dark:bg-zinc-900">
              <h3 className="text-2xl font-medium tracking-tight uppercase mb-6 pb-2 border-b border-black dark:border-zinc-800">
                Gửi Tin Nhắn Cho Chúng Tôi
              </h3>

              {submitted ? (
                <div className="p-8 bg-white dark:bg-zinc-950 border border-black dark:border-zinc-800 text-center space-y-4">
                  <CheckCircle2 className="w-12 h-12 text-black dark:text-white mx-auto" />
                  <h4 className="text-xl font-medium uppercase">Cảm Ơn Bạn Đã Liên Hệ!</h4>
                  <p className="text-sm text-neutral-600 dark:text-zinc-400">
                    Chúng tôi đã ghi nhận yêu cầu và sẽ phản hồi qua Email/SĐT của bạn trong vòng 24 giờ.
                  </p>
                  <Button
                    onClick={() => setSubmitted(false)}
                    variant="outline"
                    className="rounded-none border-black dark:border-zinc-700 text-xs font-mono uppercase mt-4"
                  >
                    Gửi Tin Nhắn Khác
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-mono uppercase mb-1">Họ & Tên *</label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Nguyễn Văn A"
                      className="w-full h-12 bg-white dark:bg-zinc-950 border border-black dark:border-zinc-800 px-4 text-sm outline-none rounded-none focus:ring-1 focus:ring-black"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono uppercase mb-1">Email *</label>
                      <input
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="nguyenvana@gmail.com"
                        className="w-full h-12 bg-white dark:bg-zinc-950 border border-black dark:border-zinc-800 px-4 text-sm outline-none rounded-none focus:ring-1 focus:ring-black"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono uppercase mb-1">Số điện thoại *</label>
                      <input
                        type="tel"
                        required
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="0901234567"
                        className="w-full h-12 bg-white dark:bg-zinc-950 border border-black dark:border-zinc-800 px-4 text-sm outline-none rounded-none focus:ring-1 focus:ring-black"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase mb-1">Nội dung tư vấn / yêu cầu *</label>
                    <textarea
                      required
                      rows={4}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder="Cần tư vấn thông số kỹ thuật sản phẩm..."
                      className="w-full bg-white dark:bg-zinc-950 border border-black dark:border-zinc-800 p-4 text-sm outline-none rounded-none focus:ring-1 focus:ring-black"
                    ></textarea>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-14 bg-black text-white hover:bg-neutral-900 dark:bg-white dark:text-black rounded-none text-sm font-medium uppercase tracking-tight flex items-center justify-center gap-2 border border-black dark:border-zinc-700"
                  >
                    <Send className="w-4 h-4" />
                    <span>Gửi Yêu Cầu Phản Hồi</span>
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
