import { z } from "zod";

// Regex SĐT VN: 0xxxxxxxxx (10 số) hoặc +84xxxxxxxxx.
const phoneRegex = /^(0\d{9}|\+84\d{9})$/;
// Chặn ký tự điều khiển/script tag cơ bản - lớp UX, chặn injection thật vẫn ở BE qua JPA.
const safeTextPattern = /^[^<>{}[\]\\`]*$/;

export const addressSchema = z.object({
  recipientName: z
    .string()
    .min(1, "Vui lòng nhập tên người nhận")
    .max(150, "Tên người nhận tối đa 150 ký tự")
    .regex(safeTextPattern, "Tên chứa ký tự không hợp lệ"),
  phone: z
    .string()
    .min(1, "Vui lòng nhập số điện thoại")
    .max(20, "Số điện thoại tối đa 20 ký tự")
    .regex(phoneRegex, "Số điện thoại không hợp lệ (VD: 0912345678)"),
  province: z.string().min(1, "Vui lòng nhập tỉnh/thành phố"),
  district: z.string().min(1, "Vui lòng nhập quận/huyện"),
  ward: z.string().min(1, "Vui lòng nhập phường/xã"),
  detailAddress: z
    .string()
    .min(1, "Vui lòng nhập địa chỉ chi tiết")
    .max(255, "Địa chỉ chi tiết tối đa 255 ký tự")
    .regex(safeTextPattern, "Địa chỉ chứa ký tự không hợp lệ"),
  isDefault: z.boolean().default(false),
  note: z
    .string()
    .max(255, "Ghi chú tối đa 255 ký tự")
    .regex(safeTextPattern, "Ghi chú chứa ký tự không hợp lệ")
    .optional()
    .or(z.literal("")),
});

export type AddressFormValues = z.infer<typeof addressSchema>;
