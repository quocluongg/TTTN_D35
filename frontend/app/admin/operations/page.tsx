"use client";
import { useQuery } from "@tanstack/react-query";
import http from "@/lib/http";
type Api<T>={data:T};
export default function OperationsPage(){
 const inventory=useQuery({queryKey:["inventory"],queryFn:async()=>((await http.get("/admin/inventory")) as Api<any[]>).data});
 const orders=useQuery({queryKey:["orders"],queryFn:async()=>((await http.get("/admin/orders")) as Api<any[]>).data});
 const Section=({title,rows}:{title:string;rows:any[]|undefined})=><section className="rounded-xl border bg-white p-5"><h2 className="text-xl font-semibold">{title}</h2><div className="mt-4 overflow-auto"><table className="w-full text-left text-sm"><tbody>{rows?.slice(0,10).map((row,i)=><tr key={i} className="border-b"><td className="p-2">{Object.values(row).slice(0,4).map(v=>String(v??"-")).join(" · ")}</td></tr>)??<tr><td className="p-2">Đang tải…</td></tr>}</tbody></table></div></section>;
 return <main className="min-h-screen bg-slate-50 p-8"><a className="underline" href="/admin">← Dashboard</a><h1 className="my-5 text-3xl font-bold">Vận hành cửa hàng</h1><div className="grid gap-6 lg:grid-cols-2"><Section title="Tồn kho" rows={inventory.data}/><Section title="Đơn hàng" rows={orders.data}/></div><p className="mt-6 text-sm text-slate-600">Các API quản trị cho điều chỉnh kho, chuyển trạng thái đơn, khuyến mãi, bảo hành và tin tức đã sẵn sàng dưới `/admin/*`.</p></main>
}
