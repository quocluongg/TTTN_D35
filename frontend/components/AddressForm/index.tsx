"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addressSchema, AddressFormValues } from "@/schemas/addressSchema";

interface AddressFormProps {
  initial?: Partial<AddressFormValues & { id?: string }>;
  onClose: () => void;
  onSave: (data: AddressFormValues & { saveToBook?: boolean }) => void;
  showSaveToBookOption?: boolean;
  isPending?: boolean;
}

export default function AddressForm({
  initial,
  onClose,
  onSave,
  showSaveToBookOption = false,
  isPending = false,
}: AddressFormProps) {
  const [saveToBook, setSaveToBook] = useState(true);

  const defaultValues: AddressFormValues = {
    recipientName: initial?.recipientName || (initial as any)?.receiverName || "",
    phone: initial?.phone || "",
    province: initial?.province || "",
    district: initial?.district || "",
    ward: initial?.ward || "",
    detailAddress: initial?.detailAddress || (initial as any)?.addressLine || "",
    isDefault: initial?.isDefault ?? false,
    note: initial?.note || "",
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isDirty },
  } = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues,
    mode: "onChange",
  });

  const onSubmit = (data: AddressFormValues) => {
    onSave({ ...data, saveToBook });
  };

  const isCreate = !initial?.id;
  const canSubmit = isCreate ? isValid : isValid && isDirty;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div className="w-full max-w-lg border border-black bg-white p-6 shadow-lg">
        <h3 className="text-xl font-medium">{initial?.id ? "Cập nhật địa chỉ" : "Thêm địa chỉ mới"}</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium">Họ và tên người nhận *</label>
            <input
              {...register("recipientName")}
              placeholder="Ví dụ: Nguyễn Văn A"
              className="mt-1 w-full border border-black px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
            />
            {errors.recipientName && (
              <p className="mt-1 text-xs text-red-600">{errors.recipientName.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium">Số điện thoại *</label>
            <input
              {...register("phone")}
              placeholder="Ví dụ: 0912345678"
              className="mt-1 w-full border border-black px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
            />
            {errors.phone && (
              <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-medium">Tỉnh/Thành *</label>
              <input
                {...register("province")}
                placeholder="Tỉnh/Thành"
                className="mt-1 w-full border border-black px-2 py-2 text-sm"
              />
              {errors.province && (
                <p className="mt-1 text-[10px] text-red-600">{errors.province.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium">Quận/Huyện *</label>
              <input
                {...register("district")}
                placeholder="Quận/Huyện"
                className="mt-1 w-full border border-black px-2 py-2 text-sm"
              />
              {errors.district && (
                <p className="mt-1 text-[10px] text-red-600">{errors.district.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium">Phường/Xã *</label>
              <input
                {...register("ward")}
                placeholder="Phường/Xã"
                className="mt-1 w-full border border-black px-2 py-2 text-sm"
              />
              {errors.ward && (
                <p className="mt-1 text-[10px] text-red-600">{errors.ward.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">Địa chỉ chi tiết (Số nhà, đường) *</label>
            <input
              {...register("detailAddress")}
              placeholder="Ví dụ: 123 Nguyễn Văn Cừ"
              className="mt-1 w-full border border-black px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
            />
            {errors.detailAddress && (
              <p className="mt-1 text-xs text-red-600">{errors.detailAddress.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium">Ghi chú (Tùy chọn)</label>
            <input
              {...register("note")}
              placeholder="Ghi chú giao hàng (ví dụ: giờ hành chính)"
              className="mt-1 w-full border border-black px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
            />
            {errors.note && (
              <p className="mt-1 text-xs text-red-600">{errors.note.message}</p>
            )}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isDefault"
              {...register("isDefault")}
              className="h-4 w-4 border-black text-black"
            />
            <label htmlFor="isDefault" className="text-sm cursor-pointer">
              Đặt làm địa chỉ mặc định
            </label>
          </div>

          {showSaveToBookOption && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="saveToBook"
                checked={saveToBook}
                onChange={(e) => setSaveToBook(e.target.checked)}
                className="h-4 w-4 border-black text-black"
              />
              <label htmlFor="saveToBook" className="text-sm cursor-pointer">
                Lưu địa chỉ này vào sổ địa chỉ cho lần sau
              </label>
            </div>
          )}

          <div className="mt-6 flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="border border-black px-4 py-2 text-sm hover:bg-zinc-100"
              disabled={isPending}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={!canSubmit || isPending}
              className="bg-black px-5 py-2 text-sm text-white disabled:opacity-40"
            >
              {isPending ? "Đang lưu..." : "Lưu địa chỉ"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
