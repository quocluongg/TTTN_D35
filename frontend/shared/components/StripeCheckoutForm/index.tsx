"use client";

import { useState } from "react";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { getStripe } from "@/lib/stripe";
import { notifyError } from "@/components/Notify";

interface Props {
  clientSecret: string;
  orderId: string;
  onCancel: () => void;
}

// BE tạo PaymentIntent với automaticPaymentMethods.enabled=true (StripePaymentStrategy.java)
// -> bắt buộc dùng PaymentElement, không dùng CardElement cũ (PaymentElement mới đọc được cấu hình này).
function InnerForm({ orderId, onCancel }: { orderId: string; onCancel: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!stripe || !elements) return;
    setSubmitting(true);
    // Kết quả CHÍNH THỨC do Stripe webhook (handleStripeWebhook ở BE) set paymentStatus=PAID.
    // return_url chỉ để hiển thị tạm cho khách, trang /payment sẽ tự retrieve trạng thái.
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment?orderId=${orderId}`,
      },
    });
    if (error) {
      notifyError(error.message || "Thanh toán không thành công. Vui lòng kiểm tra lại thông tin thẻ.");
      setSubmitting(false);
    }
    // Nếu không có lỗi, Stripe tự redirect sang return_url - không cần xử lý gì thêm ở đây.
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-lg border border-black bg-white p-6">
        <h3 className="text-xl font-medium">Thanh toán bằng thẻ quốc tế</h3>
        <p className="mt-1 text-xs text-zinc-500">
          Thẻ test: 4242 4242 4242 4242 · ngày hết hạn bất kỳ trong tương lai · CVC bất kỳ 3 số.
        </p>
        <div className="mt-4">
          <PaymentElement />
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onCancel} disabled={submitting} className="border border-black px-4 py-2 disabled:opacity-40">
            Hủy
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!stripe || submitting}
            className="bg-black px-4 py-2 text-white disabled:opacity-40"
          >
            {submitting ? "Đang xử lý…" : "Xác nhận thanh toán"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StripeCheckoutForm({ clientSecret, orderId, onCancel }: Props) {
  return (
    <Elements stripe={getStripe()} options={{ clientSecret }}>
      <InnerForm orderId={orderId} onCancel={onCancel} />
    </Elements>
  );
}
