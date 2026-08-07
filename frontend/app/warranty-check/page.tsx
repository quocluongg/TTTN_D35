"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { warrantyService } from "@/services/warrantyService";
import PublicLayout from "@/shared/layouts/PublicLayout";
import { notifyError } from "@/components/Notify";

type Any = Record<string, any>;
const unwrap = (x: any) => x?.data ?? x;

export default function WarrantyCheckPage() {
  const [phone, setPhone] = useState("");
  const [serial, setSerial] = useState("");

  const lookup = useMutation({
    mutationFn: () => warrantyService.lookup(phone.trim(), serial.trim()),
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || "Không tìm thấy thông tin bảo hành.";
      notifyError(msg);
    },
  });

  const card: Any = unwrap(lookup.data);
  const isValidPhone = /^0[0-9]{9}$/.test(phone.trim());
  const isValidSerial = serial.trim().length > 0;
  const canLookup = isValidPhone && isValidSerial;

  return (
    <PublicLayout fullWidth>
      <main className="min-h-screen bg-zinc-100">
        <section className="border-b border-black bg-white p-8 lg:p-16">
          <h1 className="text-4xl font-medium tracking-tight">Tra cứu bảo hành</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Vui lòng nhập Số điện thoại mua hàng và Số Serial thiết bị để tra cứu thông tin thẻ bảo hành.
          </p>
          <form
            className="mt-6 grid gap-4 max-w-2xl sm:grid-cols-[1fr_1fr_auto]"
            onSubmit={(e) => {
              e.preventDefault();
              if (canLookup) lookup.mutate();
            }}
          >
            <div>
              <input
                required
                type="tel"
                className="w-full border border-black px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-black"
                placeholder="Số điện thoại (ví dụ: 0912345678)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              {phone && !isValidPhone && (
                <p className="mt-1 text-xs text-red-600">SĐT gồm 10 số (bắt đầu bằng số 0)</p>
              )}
            </div>

            <div>
              <input
                required
                type="text"
                className="w-full border border-black px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-black"
                placeholder="Số serial sản phẩm"
                value={serial}
                onChange={(e) => setSerial(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="bg-black px-6 py-3 text-sm font-medium text-white disabled:opacity-40"
              disabled={!canLookup || lookup.isPending}
            >
              {lookup.isPending ? "Đang tra..." : "Tra cứu"}
            </button>
          </form>
        </section>

        <section className="p-8 lg:p-16">
          {lookup.isError && (
            <div className="max-w-4xl border border-red-500 bg-red-50 p-5 text-red-700">
              <h3 className="font-medium text-lg">Không tìm thấy thông tin</h3>
              <p className="mt-1 text-sm">
                Vui lòng kiểm tra lại Số điện thoại và Số Serial. Nếu cần trợ giúp, vui lòng liên hệ hotline hỗ trợ.
              </p>
            </div>
          )}

          {card && (
            <article className="max-w-4xl border border-black bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 pb-4">
                <div>
                  <h2 className="text-2xl font-medium">
                    {card.productName || card.product?.name || "Sản phẩm điện tử"}
                  </h2>
                  {card.customerName && (
                    <p className="mt-1 text-sm text-zinc-600">Khách hàng: {card.customerName}</p>
                  )}
                </div>
                <span className="border border-black px-3 py-1 text-sm font-medium">
                  {card.status || "ACTIVE"}
                </span>
              </div>

              <dl className="mt-6 grid gap-5 sm:grid-cols-3">
                {[
                  ["Số Serial", card.serialNumber || card.serial],
                  ["Ngày mua", card.purchaseDate ? new Date(card.purchaseDate).toLocaleDateString("vi-VN") : "—"],
                  ["Hạn bảo hành", card.expiryDate || card.warrantyEndDate ? new Date(card.expiryDate || card.warrantyEndDate).toLocaleDateString("vi-VN") : "—"],
                ].map(([label, value]) => (
                  <div key={String(label)}>
                    <dt className="text-xs uppercase tracking-wider text-zinc-500 font-medium">{label}</dt>
                    <dd className="mt-1 font-semibold text-base">{String(value || "—")}</dd>
                  </div>
                ))}
              </dl>

              {Array.isArray(card.histories) && card.histories.length > 0 && (
                <div className="mt-8 border-t border-black pt-5">
                  <h3 className="font-medium text-lg">Lịch sử bảo hành</h3>
                  <div className="mt-3 space-y-2">
                    {card.histories.map((item: Any, index: number) => (
                      <div key={item.id || index} className="border border-zinc-200 p-3 text-sm flex justify-between">
                        <div>
                          <strong className="block">{item.title || item.action || "Bảo hành / Sửa chữa"}</strong>
                          <p className="text-zinc-600">{item.description || item.note}</p>
                        </div>
                        <span className="text-xs text-zinc-500">
                          {item.createdAt ? new Date(item.createdAt).toLocaleDateString("vi-VN") : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </article>
          )}
        </section>
      </main>
    </PublicLayout>
  );
}
