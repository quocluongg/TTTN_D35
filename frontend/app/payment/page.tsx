"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { paymentService } from "@/services/paymentService";
import { Suspense } from "react";
export default function PaymentPage(){return <Suspense fallback={<main className="grid min-h-screen place-items-center">Đang tải…</main>}><PaymentResult/></Suspense>}
function PaymentResult(){const params=useSearchParams();const query=Object.fromEntries(params.entries());const result=useQuery({queryKey:["payment-return",query],queryFn:()=>paymentService.vnpayReturn(query),enabled:Object.keys(query).some(key=>key.startsWith("vnp_"))});const api:any=result.data?.data??result.data;const failed=params.get("status")==="failure"||api?.success===false;return <main className="grid min-h-screen place-items-center bg-zinc-100 p-6"><section className="w-full max-w-lg border border-black bg-white p-8 text-center"><p className="text-sm uppercase tracking-widest">Kết quả thanh toán</p><h1 className={`mt-3 text-3xl font-medium ${failed?"text-red-700":"text-green-700"}`}>{result.isLoading?"Đang xác nhận…":failed?"Thanh toán chưa thành công":"Đặt hàng thành công"}</h1><p className="mt-4 text-sm text-zinc-600">{api?.message||`Mã đơn hàng: ${params.get("orderId")||api?.orderCode||"đang cập nhật"}`}</p><div className="mt-8 flex justify-center gap-3"><Link className="border border-black px-4 py-3 text-sm" href="/shop">Tiếp tục mua sắm</Link><Link className="bg-black px-4 py-3 text-sm text-white" href="/account">Xem đơn hàng</Link></div></section></main>}
