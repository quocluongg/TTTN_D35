import { z } from "zod";

export const profileSchema = z.object({
  fullName: z
    .string()
    .min(1, "Họ và tên không được để trống")
    .max(150, "Họ và tên tối đa 150 ký tự"),
  phoneNumber: z
    .string()
    .regex(/^0[0-9]{9}$/, "Số điện thoại phải gồm 10 chữ số (bắt đầu bằng số 0)")
    .optional()
    .or(z.literal("")),
  avatarUrl: z.string().max(2000, "URL avatar tối đa 2000 ký tự").optional().or(z.literal("")),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
