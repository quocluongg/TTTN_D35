"use client";

import React, { useState } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { notifyError } from "@/components/Notify";

interface StripeCheckoutFormProps {
  orderId: string;
  onSuccess?: () => void;
}

export default function StripeCheckoutForm({
  orderId,
  onSuccess,
}: StripeCheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const returnUrl = `${window.location.origin}/payment?orderId=${orderId}`;

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: returnUrl,
      },
    });

    if (error) {
      notifyError(error.message || "Thanh toán Stripe không thành công!");
      setIsProcessing(false);
    } else {
      if (onSuccess) onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 border border-black p-6 bg-white shadow-md">
      <h3 className="text-lg font-bold">Thanh toán thẻ bằng Stripe</h3>
      <PaymentElement />
      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full bg-black py-3 text-sm font-bold text-white hover:bg-zinc-800 disabled:opacity-40 transition-colors cursor-pointer"
      >
        {isProcessing ? "Đang xử lý..." : "Xác nhận thanh toán thẻ"}
      </button>
    </form>
  );
}
