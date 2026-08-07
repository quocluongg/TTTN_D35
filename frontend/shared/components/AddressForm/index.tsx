"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addressSchema, type AddressFormValues } from "@/schemas/addressSchema";

type AddressLike = Partial<AddressFormValues> & { id?: string };

interface Props {
  initial: AddressLike;
  onClose: () => void;
  // saveToBook luôn true khi mở từ Account (không có lựa chọn nào khác - checkbox bị ẩn).
  // Khi mở từ Checkout: true nếu user tick "Lưu địa chỉ này cho lần sau", false nếu không tick
  // (BE vẫn phải POST /addresses để có id dùng cho OrderCreateRequest.addressId - "không lưu"
  // nghĩa là bên gọi (Checkout) sẽ tự xoá address này sau khi đặt hàng xong, xem checkout/page.tsx).
  onSave: (address: AddressFormValues & { id?: string }, saveToBook: boolean) => void;
  saving?: boolean;
  // Chỉ hiện checkbox "Lưu cho lần sau" khi mở từ Checkout để tạo địa chỉ mới.
  showSaveToBookOption?: boolean;
}

const FIELDS: { key: keyof AddressFormValues; label: string }[] = [
  { key: "recipientName", label: "Người nhận" },
  { key: "phone", label: "Số điện thoại" },
  { key: "detailAddress", label: "Địa chỉ chi tiết (số nhà, đường...)" },
  { key: "ward", label: "Phường/Xã" },
  { key: "district", label: "Quận/Huyện" },
  { key: "province", label: "Tỉnh/Thành phố" },
];

export default function AddressForm({ initial, onClose, onSave, saving, showSaveToBookOption }: Props) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<AddressFormValues & { saveToBook: boolean }>({
    resolver: zodResolver(addressSchema) as any,
    mode: "onChange",
    defaultValues: {
      recipientName: initial.recipientName || "",
      phone: initial.phone || "",
      province: initial.province || "",
      district: initial.district || "",
      ward: initial.ward || "",
      detailAddress: initial.detailAddress || "",
      isDefault: initial.isDefault || false,
      note: initial.note || "",
      // Mặc định KHÔNG tick "lưu cho lần sau" khi tạo mới trong Checkout.
      saveToBook: !showSaveToBookOption ? true : false,
    },
  });

  const isDefault = watch("isDefault");
  const saveToBook = watch("saveToBook");

  const submit = (values: AddressFormValues & { saveToBook: boolean }) => {
    const { saveToBook: save, ...address } = values;
    onSave({ ...address, id: initial.id }, showSaveToBookOption ? save : true);
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <form
        onSubmit={handleSubmit(submit)}
        className="w-full max-w-lg border border-black bg-white p-6 max-h-[90vh] overflow-y-auto"
      >
        <h3 className="text-xl font-medium">{initial.id ? "Cập nhật" : "Thêm"} địa chỉ</h3>
        <div className="mt-4 grid gap-3">
          {FIELDS.map(({ key, label }) => (
            <div key={key}>
              <input
                placeholder={label}
                {...register(key as any)}
                className="w-full border border-black px-3 py-2"
              />
              {errors[key] && <p className="mt-1 text-xs text-red-600">{errors[key]?.message as string}</p>}
            </div>
          ))}
          <div>
            <input
              placeholder="Ghi chú (không bắt buộc)"
              {...register("note")}
              className="w-full border border-black px-3 py-2"
            />
            {errors.note && <p className="mt-1 text-xs text-red-600">{errors.note.message}</p>}
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setValue("isDefault", e.target.checked, { shouldValidate: true })}
            />
            Đặt làm địa chỉ mặc định
          </label>
          {showSaveToBookOption && (
            <label className="flex items-center gap-2 text-sm border-t border-zinc-200 pt-3">
              <input
                type="checkbox"
                checked={saveToBook}
                onChange={(e) => setValue("saveToBook", e.target.checked, { shouldValidate: true })}
              />
              Lưu địa chỉ này cho lần sau
            </label>
          )}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="border border-black px-4 py-2">
            Hủy
          </button>
          <button
            type="submit"
            disabled={!isValid || saving}
            className="bg-black px-4 py-2 text-white disabled:opacity-40"
          >
            {saving ? "Đang lưu…" : "Lưu"}
          </button>
        </div>
      </form>
    </div>
  );
}
