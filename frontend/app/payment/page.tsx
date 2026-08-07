"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { paymentService } from "@/services/paymentService";
import { getStripe } from "@/lib/stripe";
import { Suspense, useEffect, useState } from "react";

export default function PaymentPage(){return <Suspense fallback={<main className="grid min-h-screen place-items-center">Đang tải…</main>}><PaymentResult/></Suspense>}

function PaymentResult(){
  const params=useSearchParams();
  const query=Object.fromEntries(params.entries());
  const isVnpayReturn = Object.keys(query).some(key=>key.startsWith("vnp_"));
  // Stripe redirect về kèm payment_intent_client_secret (confirmPayment với return_url).
  const stripeClientSecret = params.get("payment_intent_client_secret");

  const vnpayResult=useQuery({
    queryKey:["payment-return",query],
    queryFn:()=>paymentService.vnpayReturn(query),
    enabled:isVnpayReturn,
  });

  // Stripe: chỉ đọc trạng thái tạm để hiển thị cho khách ngay - kết quả CHÍNH THỨC (paymentStatus=PAID)
  // do webhook Stripe xử lý ở BE (PaymentServiceImpl.handleStripeWebhook), không suy đoán ở đây.
  const [stripeStatus,setStripeStatus]=useState<string|null>(null);
  useEffect(()=>{
    if(!stripeClientSecret) return;
    getStripe().then(async(stripe)=>{
      if(!stripe) return;
      const {paymentIntent}=await stripe.retrievePaymentIntent(stripeClientSecret);
      setStripeStatus(paymentIntent?.status||null);
    });
  },[stripeClientSecret]);

  const api:any=vnpayResult.data?.data??vnpayResult.data;
  const orderId=params.get("orderId")||api?.orderId;

  let title="Đặt hàng thành công";
  let isFailed=false;
  let isLoading=false;

  if(isVnpayReturn){
    isLoading=vnpayResult.isLoading;
    isFailed = params.get("status")==="failure" || api?.success===false;
    title = isLoading?"Đang xác nhận…":isFailed?"Thanh toán chưa thành công":"Đặt hàng thành công";
  } else if(stripeClientSecret){
    isLoading = stripeStatus===null;
    isFailed = stripeStatus!=null && !["succeeded","processing"].includes(stripeStatus);
    title = isLoading?"Đang xác nhận…":stripeStatus==="processing"?"Đang xử lý thanh toán…":isFailed?"Thanh toán chưa thành công":"Đặt hàng thành công";
  } else {
    isFailed = params.get("status")==="failure";
    title = isFailed?"Thanh toán chưa thành công":"Đặt hàng thành công";
  }

  return <main className="grid min-h-screen place-items-center bg-zinc-100 p-6"><section className="w-full max-w-lg border border-black bg-white p-8 text-center"><p className="text-sm uppercase tracking-widest">Kết quả thanh toán</p><h1 className={`mt-3 text-3xl font-medium ${isFailed?"text-red-700":"text-green-700"}`}>{title}</h1><p className="mt-4 text-sm text-zinc-600">{api?.message||`Mã đơn hàng: ${orderId||"đang cập nhật"}`}</p><div className="mt-8 flex justify-center gap-3"><Link className="border border-black px-4 py-3 text-sm" href="/shop">Tiếp tục mua sắm</Link><Link className="bg-black px-4 py-3 text-sm text-white" href="/account?tab=orders">Xem đơn hàng</Link></div></section></main>;
}
