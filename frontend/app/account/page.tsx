"use client";

import React, { useState } from "react";
import Link from "next/link";
import PublicLayout from "@/shared/layouts/PublicLayout";
import { useLogout, useCurrentUser } from "@/hooks/useAuth";
import {
  User,
  Mail,
  MapPin,
  Phone,
  Lock,
  Edit2,
  X,
  Package,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  LogOut,
  Loader2,
} from "lucide-react";

export default function AccountPage() {
  const logout = useLogout();
  const { data: user, isLoading: isUserLoading } = useCurrentUser();

  // Active Main Tab: 'profile' | 'orders'
  const [activeTab, setActiveTab] = useState<"profile" | "orders">("profile");

  // Editable Profile State
  const [profile, setProfile] = useState({
    firstName: "John",
    lastName: "Doe",
    email: "johndoe@example.com",
    address: "206 Batran's Street, 39, 2044 Ontario, Ottawa",
    phone: "+1 222 333 4444",
  });

  // Modal Control State: null | 'name' | 'email' | 'address' | 'phone' | 'password' | 'forgot'
  const [activeModal, setActiveModal] = useState<
    null | "name" | "email" | "address" | "phone" | "password" | "forgot"
  >(null);

  // Form Fields inside Modals
  const [tempFirstName, setTempFirstName] = useState(profile.firstName);
  const [tempLastName, setTempLastName] = useState(profile.lastName);
  const [tempEmail, setTempEmail] = useState(profile.email);
  const [tempAddress, setTempAddress] = useState(profile.address);
  const [tempPhone, setTempPhone] = useState(profile.phone);

  // Password Modal Fields
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [rePass, setRePass] = useState("");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showRePass, setShowRePass] = useState(false);
  const [passMismatchError, setPassMismatchError] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");

  const handleOpenModal = (modalType: "name" | "email" | "address" | "phone" | "password") => {
    setActiveModal(modalType);
    setSaveSuccessMsg("");
    setPassMismatchError(false);
    if (modalType === "name") {
      setTempFirstName(profile.firstName);
      setTempLastName(profile.lastName);
    } else if (modalType === "email") {
      setTempEmail(profile.email);
    } else if (modalType === "address") {
      setTempAddress(profile.address);
    } else if (modalType === "phone") {
      setTempPhone(profile.phone);
    } else if (modalType === "password") {
      setCurrentPass("");
      setNewPass("");
      setRePass("");
    }
  };

  const handleCloseModal = () => {
    setActiveModal(null);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    if (activeModal === "password") {
      if (newPass !== rePass) {
        setPassMismatchError(true);
        setIsSaving(false);
        return;
      }
    }

    setTimeout(() => {
      setIsSaving(false);
      if (activeModal === "name") {
        setProfile((prev) => ({ ...prev, firstName: tempFirstName, lastName: tempLastName }));
      } else if (activeModal === "email") {
        setProfile((prev) => ({ ...prev, email: tempEmail }));
      } else if (activeModal === "address") {
        setProfile((prev) => ({ ...prev, address: tempAddress }));
      } else if (activeModal === "phone") {
        setProfile((prev) => ({ ...prev, phone: tempPhone }));
      }

      setSaveSuccessMsg("Đã cập nhật thông tin thành công!");
      setTimeout(() => {
        handleCloseModal();
        setSaveSuccessMsg("");
      }, 1200);
    }, 800);
  };

  // Mock Orders Data
  const MOCK_ORDERS = [
    {
      id: "ORD-9021",
      date: "20 Tháng 7, 2026",
      status: "Đang giao hàng",
      total: "5.000.000đ",
      items: ["Carbon Shadow Pro"],
      badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
    },
    {
      id: "ORD-8812",
      date: "12 Tháng 6, 2026",
      status: "Giao hàng thành công",
      total: "15.000.000đ",
      items: ["Nimbus Drift Frost"],
      badgeColor: "bg-green-100 text-green-800 border-green-300",
    },
    {
      id: "ORD-7640",
      date: "04 Tháng 5, 2026",
      status: "Giao hàng thành công",
      total: "1.200.000đ",
      items: ["Ashen Path Xtreme"],
      badgeColor: "bg-green-100 text-green-800 border-green-300",
    },
  ];

  return (
    <PublicLayout fullWidth>
      <div className="w-full bg-[#F2F2F2] dark:bg-zinc-950 text-black dark:text-white transition-colors duration-300 min-h-[calc(100vh-60px)]">
        
        {/* =========================================================================
            HEADER TITLE: My Account
           ========================================================================= */}
        <section className="w-full border-b border-black dark:border-zinc-800">
          <div className="w-[1920px] max-w-full mx-auto p-8 lg:p-12">
            <h1 className="text-[36px] sm:text-[60px] lg:text-[96px] font-bold tracking-tight leading-none">
              My Account
            </h1>
          </div>
        </section>

        {/* =========================================================================
            MAIN BODY: 2 COLUMN LAYOUT (LEFT TABS + RIGHT CONTENT)
           ========================================================================= */}
        <section className="w-full border-b border-black dark:border-zinc-800">
          <div className="w-[1920px] max-w-full mx-auto flex flex-col lg:flex-row">
            
            {/* LEFT NAVIGATION SIDEBAR */}
            <aside className="w-full lg:w-[360px] shrink-0 border-b lg:border-b-0 lg:border-r border-black dark:border-zinc-800 bg-white dark:bg-zinc-900 divide-y divide-black dark:divide-zinc-800">
              <button
                onClick={() => setActiveTab("orders")}
                className={`w-full p-6 text-left text-[20px] font-bold flex items-center gap-3 transition-colors cursor-pointer ${
                  activeTab === "orders"
                    ? "bg-black text-white dark:bg-white dark:text-black"
                    : "hover:bg-[#C5FA1F] hover:text-black"
                }`}
              >
                <Package className="w-5 h-5" />
                <span>Order History</span>
              </button>

              <button
                onClick={() => setActiveTab("profile")}
                className={`w-full p-6 text-left text-[20px] font-bold flex items-center gap-3 transition-colors cursor-pointer ${
                  activeTab === "profile"
                    ? "bg-black text-white dark:bg-white dark:text-black"
                    : "hover:bg-[#C5FA1F] hover:text-black"
                }`}
              >
                <User className="w-5 h-5" />
                <span>Profile Settings</span>
              </button>

              <button
                onClick={logout}
                className="w-full p-6 text-left text-[20px] font-bold text-red-600 dark:text-red-400 flex items-center gap-3 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
              >
                <LogOut className="w-5 h-5" />
                <span>Log Out</span>
              </button>
            </aside>

            {/* RIGHT CONTENT AREA */}
            <main className="flex-1 p-8 lg:p-12 bg-white dark:bg-zinc-900">
              
              {/* TAB 1: PROFILE SETTINGS */}
              {activeTab === "profile" && (
                <div className="space-y-8 max-w-[900px]">
                  <div className="pb-4 border-b border-black/10 dark:border-white/10">
                    <h2 className="text-[28px] sm:text-[36px] font-bold">Thông tin cá nhân</h2>
                    <p className="text-zinc-600 dark:text-zinc-400 text-sm">
                      Quản lý chi tiết hồ sơ tài khoản và địa chỉ giao hàng của bạn.
                    </p>
                  </div>

                  {/* SETTINGS TILES GRID */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Tile 1: Full Name */}
                    <div className="p-6 bg-[#F9F9F9] dark:bg-zinc-800/50 border border-black dark:border-zinc-700 flex items-start justify-between">
                      <div className="space-y-1">
                        <span className="text-xs uppercase font-bold text-zinc-500 tracking-wider">
                          Full Name
                        </span>
                        <p className="text-[20px] font-bold">
                          {profile.firstName} {profile.lastName}
                        </p>
                      </div>
                      <button
                        onClick={() => handleOpenModal("name")}
                        className="px-4 py-2 border border-black dark:border-white text-xs font-bold uppercase flex items-center gap-1.5 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Edit
                      </button>
                    </div>

                    {/* Tile 2: Email Address */}
                    <div className="p-6 bg-[#F9F9F9] dark:bg-zinc-800/50 border border-black dark:border-zinc-700 flex items-start justify-between">
                      <div className="space-y-1">
                        <span className="text-xs uppercase font-bold text-zinc-500 tracking-wider">
                          Email Address
                        </span>
                        <p className="text-[18px] font-bold truncate max-w-[200px] sm:max-w-none">
                          {profile.email}
                        </p>
                      </div>
                      <button
                        onClick={() => handleOpenModal("email")}
                        className="px-4 py-2 border border-black dark:border-white text-xs font-bold uppercase flex items-center gap-1.5 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Edit
                      </button>
                    </div>

                    {/* Tile 3: Shipping Address */}
                    <div className="p-6 bg-[#F9F9F9] dark:bg-zinc-800/50 border border-black dark:border-zinc-700 flex items-start justify-between md:col-span-2">
                      <div className="space-y-1 pr-4">
                        <span className="text-xs uppercase font-bold text-zinc-500 tracking-wider">
                          Shipping Address
                        </span>
                        <p className="text-[18px] font-bold">{profile.address}</p>
                      </div>
                      <button
                        onClick={() => handleOpenModal("address")}
                        className="px-4 py-2 border border-black dark:border-white text-xs font-bold uppercase flex items-center gap-1.5 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors shrink-0 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Edit
                      </button>
                    </div>

                    {/* Tile 4: Phone Number */}
                    <div className="p-6 bg-[#F9F9F9] dark:bg-zinc-800/50 border border-black dark:border-zinc-700 flex items-start justify-between">
                      <div className="space-y-1">
                        <span className="text-xs uppercase font-bold text-zinc-500 tracking-wider">
                          Phone Number
                        </span>
                        <p className="text-[18px] font-bold">{profile.phone}</p>
                      </div>
                      <button
                        onClick={() => handleOpenModal("phone")}
                        className="px-4 py-2 border border-black dark:border-white text-xs font-bold uppercase flex items-center gap-1.5 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Edit
                      </button>
                    </div>

                    {/* Tile 5: Password */}
                    <div className="p-6 bg-[#F9F9F9] dark:bg-zinc-800/50 border border-black dark:border-zinc-700 flex items-start justify-between">
                      <div className="space-y-1">
                        <span className="text-xs uppercase font-bold text-zinc-500 tracking-wider">
                          Password
                        </span>
                        <p className="text-[18px] font-bold tracking-widest">••••••••••••••••</p>
                      </div>
                      <button
                        onClick={() => handleOpenModal("password")}
                        className="px-4 py-2 border border-black dark:border-white text-xs font-bold uppercase flex items-center gap-1.5 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Edit
                      </button>
                    </div>

                  </div>
                </div>
              )}

              {/* TAB 2: ORDER HISTORY */}
              {activeTab === "orders" && (
                <div className="space-y-8 max-w-[900px]">
                  <div className="pb-4 border-b border-black/10 dark:border-white/10">
                    <h2 className="text-[28px] sm:text-[36px] font-bold">Lịch sử đơn hàng</h2>
                    <p className="text-zinc-600 dark:text-zinc-400 text-sm">
                      Theo dõi trạng thái và lịch sử các đơn hàng bạn đã mua tại ShopWise.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {MOCK_ORDERS.map((order) => (
                      <div
                        key={order.id}
                        className="p-6 bg-[#F9F9F9] dark:bg-zinc-800/50 border border-black dark:border-zinc-700 flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <span className="text-[20px] font-bold">{order.id}</span>
                            <span
                              className={`px-3 py-0.5 text-xs font-bold border ${order.badgeColor}`}
                            >
                              {order.status}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-500 font-medium">{order.date}</p>
                          <p className="text-sm font-semibold">
                            Sản phẩm: <span className="font-normal">{order.items.join(", ")}</span>
                          </p>
                        </div>

                        <div className="flex items-center justify-between md:flex-col md:items-end gap-2 pt-4 md:pt-0 border-t md:border-t-0 border-black/10 dark:border-white/10">
                          <span className="text-[22px] font-extrabold">{order.total}</span>
                          <button className="px-4 py-2 bg-black text-white dark:bg-white dark:text-black text-xs font-bold uppercase hover:bg-zinc-800 transition-colors">
                            Xem Chi Tiết
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </main>

          </div>
        </section>

        {/* =========================================================================
            INTERACTIVE MODAL OVERLAYS (EXACT FIGMA 9:4554 SPEC)
           ========================================================================= */}
        {activeModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-[480px] bg-white dark:bg-zinc-900 border border-black dark:border-zinc-700 shadow-2xl p-8 space-y-6 relative animate-in fade-in zoom-in-95 duration-200">
              
              {/* Close Icon Button */}
              <button
                onClick={handleCloseModal}
                className="absolute top-6 right-6 text-zinc-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Success Message Banner */}
              {saveSuccessMsg ? (
                <div className="py-8 text-center space-y-4">
                  <CheckCircle2 className="w-12 h-12 text-[#1CCA00] mx-auto" />
                  <h3 className="text-2xl font-bold">{saveSuccessMsg}</h3>
                </div>
              ) : (
                <form onSubmit={handleSaveModal} className="space-y-6">
                  
                  {/* MODAL 1: EDIT NAME */}
                  {activeModal === "name" && (
                    <>
                      <div className="space-y-1">
                        <h3 className="text-[28px] font-bold">First & Last Name</h3>
                        <p className="text-sm text-zinc-500">Cập nhật họ và tên tài khoản của bạn.</p>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="block text-sm font-bold uppercase">First name</label>
                          <input
                            type="text"
                            value={tempFirstName}
                            onChange={(e) => setTempFirstName(e.target.value)}
                            required
                            className="w-full h-[50px] px-4 border border-black dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[16px] focus:outline-none focus:ring-2 focus:ring-black"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm font-bold uppercase">Last name</label>
                          <input
                            type="text"
                            value={tempLastName}
                            onChange={(e) => setTempLastName(e.target.value)}
                            required
                            className="w-full h-[50px] px-4 border border-black dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[16px] focus:outline-none focus:ring-2 focus:ring-black"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* MODAL 2: EDIT EMAIL */}
                  {activeModal === "email" && (
                    <>
                      <div className="space-y-1">
                        <h3 className="text-[28px] font-bold">Email Address</h3>
                        <p className="text-sm text-zinc-500">Thay đổi địa chỉ email chính liên kết với tài khoản.</p>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-bold uppercase">Email address</label>
                        <input
                          type="email"
                          value={tempEmail}
                          onChange={(e) => setTempEmail(e.target.value)}
                          required
                          className="w-full h-[50px] px-4 border border-black dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[16px] focus:outline-none focus:ring-2 focus:ring-black"
                        />
                      </div>
                    </>
                  )}

                  {/* MODAL 3: EDIT ADDRESS */}
                  {activeModal === "address" && (
                    <>
                      <div className="space-y-1">
                        <h3 className="text-[28px] font-bold">Shipping Address</h3>
                        <p className="text-sm text-zinc-500">Cập nhật địa chỉ nhận hàng mặc định của bạn.</p>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-bold uppercase">Street address</label>
                        <textarea
                          rows={3}
                          value={tempAddress}
                          onChange={(e) => setTempAddress(e.target.value)}
                          required
                          className="w-full p-4 border border-black dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[16px] focus:outline-none focus:ring-2 focus:ring-black resize-none"
                        />
                      </div>
                    </>
                  )}

                  {/* MODAL 4: EDIT PHONE */}
                  {activeModal === "phone" && (
                    <>
                      <div className="space-y-1">
                        <h3 className="text-[28px] font-bold">Phone Number</h3>
                        <p className="text-sm text-zinc-500">Cập nhật số điện thoại liên hệ giao hàng.</p>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-bold uppercase">Phone number</label>
                        <input
                          type="tel"
                          value={tempPhone}
                          onChange={(e) => setTempPhone(e.target.value)}
                          required
                          className="w-full h-[50px] px-4 border border-black dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[16px] focus:outline-none focus:ring-2 focus:ring-black"
                        />
                      </div>
                    </>
                  )}

                  {/* MODAL 5: EDIT PASSWORD */}
                  {activeModal === "password" && (
                    <>
                      <div className="space-y-1">
                        <h3 className="text-[28px] font-bold">Change Password</h3>
                        <p className="text-sm text-zinc-500">Đổi mật khẩu mới để bảo mật tài khoản.</p>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="block text-sm font-bold uppercase">Current password</label>
                          <div className="relative flex items-center">
                            <input
                              type={showCurrentPass ? "text" : "password"}
                              value={currentPass}
                              onChange={(e) => setCurrentPass(e.target.value)}
                              required
                              className="w-full h-[50px] pl-4 pr-12 border border-black dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[16px] focus:outline-none focus:ring-2 focus:ring-black"
                            />
                            <button
                              type="button"
                              onClick={() => setShowCurrentPass(!showCurrentPass)}
                              className="absolute right-4 text-zinc-400"
                            >
                              {showCurrentPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-bold uppercase">New password</label>
                          <div className="relative flex items-center">
                            <input
                              type={showNewPass ? "text" : "password"}
                              value={newPass}
                              onChange={(e) => {
                                setNewPass(e.target.value);
                                if (passMismatchError) setPassMismatchError(false);
                              }}
                              required
                              className="w-full h-[50px] pl-4 pr-12 border border-black dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[16px] focus:outline-none focus:ring-2 focus:ring-black"
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPass(!showNewPass)}
                              className="absolute right-4 text-zinc-400"
                            >
                              {showNewPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-bold uppercase">Re-enter new password</label>
                          <div className="relative flex items-center">
                            <input
                              type={showRePass ? "text" : "password"}
                              value={rePass}
                              onChange={(e) => {
                                setRePass(e.target.value);
                                if (passMismatchError) setPassMismatchError(false);
                              }}
                              required
                              className={`w-full h-[50px] pl-4 pr-12 border ${
                                passMismatchError ? "border-red-600" : "border-black dark:border-zinc-700"
                              } bg-white dark:bg-zinc-800 text-[16px] focus:outline-none focus:ring-2 focus:ring-black`}
                            />
                            <button
                              type="button"
                              onClick={() => setShowRePass(!showRePass)}
                              className="absolute right-4 text-zinc-400"
                            >
                              {showRePass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                          </div>

                          {passMismatchError && (
                            <p className="text-red-600 text-xs font-bold pt-1">
                              Mật khẩu không trùng khớp. Vui lòng kiểm tra lại.
                            </p>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Save Action Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="w-full h-[50px] bg-black text-white dark:bg-white dark:text-black text-[18px] font-bold flex items-center justify-center gap-2 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" /> Lưu thay đổi...
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </button>
                  </div>
                </form>
              )}

            </div>
          </div>
        )}

      </div>
    </PublicLayout>
  );
}
