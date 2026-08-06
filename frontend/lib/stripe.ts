import { loadStripe, type Stripe } from "@stripe/stripe-js";

let stripePromise: Promise<Stripe | null> | null = null;

// Singleton - tránh load lại script Stripe.js mỗi lần mở form thanh toán.
export function getStripe() {
  if (!stripePromise) {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!key) {
      console.error("Thiếu NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY trong .env.local");
    }
    stripePromise = loadStripe(key || "");
  }
  return stripePromise;
}
