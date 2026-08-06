import { z } from "zod";

// Voucher code: input tự do -> giới hạn độ dài + chặn ký tự điều khiển/script tag cơ bản (chỉ là
// lớp UX, chặn injection thật vẫn ở BE qua JPA parameterized query).
const voucherCodePattern = /^[^<>{}[\]\\`]*$/;

export const checkoutSchema = z.object({
  addressId: z.string().min(1, "Vui lòng chọn địa chỉ giao hàng"),
  paymentMethod: z.enum(["COD", "VNPAY", "STRIPE"], {
    message: "Vui lòng chọn phương thức thanh toán",
  }),
  voucherCode: z
    .string()
    .max(50, "Mã giảm giá tối đa 50 ký tự")
    .regex(voucherCodePattern, "Mã giảm giá chứa ký tự không hợp lệ")
    .optional()
    .or(z.literal("")),
});

export type CheckoutFormValues = z.infer<typeof checkoutSchema>;
