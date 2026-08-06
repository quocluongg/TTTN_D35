"use client";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {useState} from "react";
import {profileService} from "@/services/profileService";
import {orderService} from "@/services/orderService";
import {useLogout} from "@/hooks/useAuth";
import StatusBadge from "@/components/StatusBadge";
import ConfirmDialog from "@/components/ConfirmDialog";
import PublicLayout from "@/shared/layouts/PublicLayout";
import AddressForm from "@/shared/components/AddressForm";
import {notifyError, notifySuccess} from "@/components/Notify";

type Any = Record<string, any>;
const unwrap = (x: any) => x?.data ?? x;
export default function AccountPage() {
    const [tab, setTab] = useState("profile");
    const query = useQueryClient();
    const logout = useLogout();
    const profile = useQuery({queryKey: ["profile"], queryFn: () => profileService.me()});
    const addresses = useQuery({queryKey: ["addresses"], queryFn: () => profileService.addresses()});
    const orders = useQuery({queryKey: ["orders"], queryFn: () => orderService.list({page: 0, size: 10})});
    const [form, setForm] = useState<Any>({});
    const [editingAddress, setEditingAddress] = useState<Any | null>(null);
    const [cancelId, setCancelId] = useState<string | null>(null);
    const updateProfile = useMutation({
        mutationFn: (data: Any) => profileService.update(data),
        onSuccess: () => query.invalidateQueries({queryKey: ["profile"]})
    });
    // saveToBook luôn true khi gọi từ Account (AddressForm ẩn checkbox này ở đây) - không cần dùng tham số thứ 2.
    const saveAddress = useMutation({
        mutationFn: (data: Any) => data.id ? profileService.updateAddress(data.id, data) : profileService.createAddress(data),
        onSuccess: () => {
            query.invalidateQueries({queryKey: ["addresses"]});
            setEditingAddress(null);
            notifySuccess("Đã lưu địa chỉ")
        },
        onError: (e: any) => notifyError(e?.response?.data?.message || e?.message)
    });
    const removeAddress = useMutation({
        mutationFn: (id: string) => profileService.deleteAddress(id),
        onSuccess: () => query.invalidateQueries({queryKey: ["addresses"]}),
        onError: (e: any) => notifyError(e?.response?.data?.message || e?.message)
    });
    const cancelOrder = useMutation({
        mutationFn: (id: string) => orderService.cancel(id),
        onSuccess: () => query.invalidateQueries({queryKey: ["orders"]})
    });
    const user: Any = unwrap(profile.data) || {};
    const addressRows: Any[] = unwrap(addresses.data) || [];
    const orderPayload: any = unwrap(orders.data) || {};
    const orderRows: Any[] = orderPayload.content || [];
    return <PublicLayout fullWidth>
        <section className="min-h-screen bg-white text-black">
            <div className="border-b border-black px-6 py-10 lg:px-12"><h1
                className="text-4xl font-medium tracking-tight">Tài khoản của tôi</h1></div>
            <div className="grid lg:grid-cols-[240px_1fr] border-b border-black">
                <aside
                    className="border-r border-black p-4">{[["profile", "Thông tin cá nhân"], ["addresses", "Sổ địa chỉ"], ["orders", "Đơn hàng của tôi"]].map(([id, label]) =>
                    <button key={id} onClick={() => setTab(id)}
                            className={`block w-full px-4 py-3 text-left text-sm font-medium ${tab === id ? "bg-black text-white" : "hover:bg-zinc-100"}`}>{label}</button>)}
                    <button onClick={logout}
                            className="mt-6 w-full border border-black px-4 py-3 text-left text-sm">Đăng xuất
                    </button>
                </aside>
                <main className="min-h-[600px] p-6 lg:p-10">{tab === "profile" &&
                    <div className="max-w-xl"><h2 className="text-2xl font-medium">Thông tin cá nhân</h2>
                        <form className="mt-6 space-y-4" onSubmit={(e) => {
                            e.preventDefault();
                            updateProfile.mutate(form)
                        }}>{[["fullName", "Họ và tên", user.fullName], ["phone", "Số điện thoại", user.phone], ["gender", "Giới tính", user.gender], ["dateOfBirth", "Ngày sinh", user.dateOfBirth]].map(([key, label, value]) =>
                            <label className="block text-sm" key={key}>{label}<input
                                type={key === "dateOfBirth" ? "date" : "text"} defaultValue={String(value ?? "")}
                                onChange={e => setForm((f: Any) => ({...f, [key]: e.target.value}))}
                                className="mt-1 block w-full border border-black px-3 py-2 rounded-none"/></label>)}
                            <button className="bg-black px-5 py-3 text-sm text-white rounded-none"
                                    disabled={updateProfile.isPending}>{updateProfile.isPending ? "Đang lưu…" : "Lưu thay đổi"}</button>
                        </form>
                    </div>}{tab === "addresses" && <div>
                    <div className="flex items-center justify-between"><h2 className="text-2xl font-medium">Sổ địa
                        chỉ</h2>
                        <button onClick={() => setEditingAddress({})}
                                className="border border-black px-4 py-2 text-sm rounded-none">Thêm địa chỉ
                        </button>
                    </div>
                    <div className="mt-6 grid gap-4 md:grid-cols-2">{addresses.isLoading ?
                        <p>Đang tải…</p> : addressRows.length ? addressRows.map((address) => <article key={address.id}
                                                                                                      className="border border-black p-5">
                            <div className="flex justify-between">
                                <strong>{address.recipientName}</strong>{address.isDefault &&
                                <StatusBadge status="ACTIVE"/>}</div>
                            <p className="mt-3 text-sm">{[address.phone, address.detailAddress, address.ward, address.district, address.province].filter(Boolean).join(" · ")}</p>{address.note &&
                            <p className="mt-1 text-xs text-zinc-500">Ghi chú: {address.note}</p>}
                            <div className="mt-5 flex gap-2">
                                <button onClick={() => setEditingAddress(address)} className="underline text-sm">Sửa
                                </button>
                                <button onClick={() => removeAddress.mutate(address.id)}
                                        className="underline text-sm text-red-700">Xóa
                                </button>
                                {!address.isDefault && <button
                                    onClick={() => profileService.setDefaultAddress(address.id).then(() => query.invalidateQueries({queryKey: ["addresses"]}))}
                                    className="underline text-sm">Đặt mặc định</button>}</div>
                        </article>) : <p className="text-zinc-500">Bạn chưa lưu địa chỉ nào.</p>}</div>
                    {editingAddress && <AddressForm initial={editingAddress} saving={saveAddress.isPending}
                                                    onClose={() => setEditingAddress(null)}
                                                    onSave={(address) => saveAddress.mutate(address)}/>}
                </div>}{tab === "orders" && <div><h2 className="text-2xl font-medium">Đơn hàng của tôi</h2>
                    <div className="mt-6 space-y-3">{orders.isLoading ?
                        <p>Đang tải…</p> : orderRows.length ? orderRows.map((order) => <article key={order.id}
                                                                                                className="flex flex-wrap items-center justify-between gap-4 border border-black p-5">
                            <div><strong>{order.orderCode || order.code || order.id}</strong><p
                                className="mt-1 text-sm text-zinc-600">{new Date(order.createdAt || Date.now()).toLocaleDateString("vi-VN")} · {Number(order.totalAmount || order.total || 0).toLocaleString("vi-VN")} ₫</p>
                            </div>
                            <div className="flex items-center gap-3"><StatusBadge
                                status={order.status}/>{["PENDING", "CONFIRMED"].includes(order.status) &&
                                <button onClick={() => setCancelId(String(order.id))}
                                        className="border border-red-700 px-3 py-2 text-sm text-red-700">Hủy
                                    đơn</button>}</div>
                        </article>) : <p className="text-zinc-500">Bạn chưa có đơn hàng nào.</p>}</div>
                </div>}</main>
            </div>
        </section>
        <ConfirmDialog open={!!cancelId} onOpenChange={(v) => !v && setCancelId(null)} title="Hủy đơn hàng?"
                       description="Thao tác này không thể hoàn tác." danger confirmText="Hủy đơn" onConfirm={() => {
            if (cancelId) cancelOrder.mutate(cancelId);
            setCancelId(null)
        }}/></PublicLayout>
}
