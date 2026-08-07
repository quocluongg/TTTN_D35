import { z } from "zod";

export const addressSchema = z.object({
  recipientName: z
    .string()
    .min(1, "Tên người nhận không được để trống")
    .max(150, "Tên người nhận tối đa 150 ký tự"),
  phone: z
    .string()
    .min(1, "Số điện thoại không được để trống")
    .regex(/^0[0-9]{9}$/, "Số điện thoại phải gồm 10 chữ số (bắt đầu bằng số 0)"),
  province: z.string().min(1, "Tỉnh/Thành phố không được để trống"),
  district: z.string().min(1, "Quận/Huyện không được để trống"),
  ward: z.string().min(1, "Phường/Xã không được để trống"),
  detailAddress: z
    .string()
    .min(1, "Địa chỉ chi tiết không được để trống")
    .max(255, "Địa chỉ chi tiết tối đa 255 ký tự"),
  isDefault: z.boolean(),
  note: z.string().max(255, "Ghi chú tối đa 255 ký tự").optional().or(z.literal("")),
});

export type AddressFormValues = z.infer<typeof addressSchema>;
