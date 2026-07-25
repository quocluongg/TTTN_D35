import React from "react";

export default function ShippingPolicyPage() {
  return (
    <div>
      <h2 className="text-3xl font-medium tracking-tight uppercase mb-6">Chính Sách Vận Chuyển & Giao Hàng</h2>
      
      <p className="text-base text-neutral-600 dark:text-zinc-400 mb-6 leading-relaxed">
        Shopwise hỗ trợ giao hàng toàn quốc với phương thức đóng gói tiêu chuẩn chống sốc chuyên dụng cho thiết bị đo lường chính xác.
      </p>

      <h3 className="text-xl font-medium uppercase mt-8 mb-4">1. Thời Gian Giao Hàng</h3>
      <ul className="list-disc pl-6 space-y-2 text-sm text-neutral-700 dark:text-zinc-300">
        <li>Nội thành TP.HCM: Hỏa tốc trong 24 giờ.</li>
        <li>Các tỉnh thành khác: Từ 2 đến 4 ngày làm việc.</li>
      </ul>

      <h3 className="text-xl font-medium uppercase mt-8 mb-4">2. Kiểm Tra Hàng Trước Khi Thanh Toán (Đồng Kiểm)</h3>
      <p className="text-sm text-neutral-700 dark:text-zinc-300 leading-relaxed mb-4">
        Khách hàng được quyền kiểm tra niêm phong, kiểm tra ngoại quan thiết bị và thử nguồn trước khi ký nhận với nhân viên giao hàng.
      </p>
    </div>
  );
}
