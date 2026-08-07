"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OrdersRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/account?tab=orders");
  }, [router]);

  return (
    <main className="min-h-screen grid place-items-center bg-white text-black text-sm font-medium">
      Đang chuyển hướng tới Đơn hàng của tôi…
    </main>
  );
}
