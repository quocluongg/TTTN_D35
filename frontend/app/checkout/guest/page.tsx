"use client";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { orderService } from "@/services/orderService";
import { useRouter } from "next/navigation";
export default function GuestCheckout(){const router=useRouter();const [form,setForm]=useState<Record<string,string>>({});const submit=useMutation({mutationFn:()=>orderService.createGuest(form),onSuccess:(data:any)=>router.push(`/payment?status=success&orderId=${data?.data?.id??data?.id??""}`)});return <main className="mx-auto max-w-xl p-8"><h1 className="text-3xl font-medium">Đặt hàng không cần đăng nhập</h1><form onSubmit={e=>{e.preventDefault();submit.mutate()}} className="mt-6 space-y-3">{[["fullName","Họ tên"],["email","Email"],["phone","Số điện thoại"],["address","Địa chỉ giao hàng"]].map(([key,label])=><input key={key} required placeholder={label} className="w-full border border-black p-3" onChange={e=>setForm({...form,[key]:e.target.value})}/>) }<button className="w-full bg-black p-3 text-white">{submit.isPending?"Đang tạo đơn…":"Đặt hàng"}</button></form></main>}
