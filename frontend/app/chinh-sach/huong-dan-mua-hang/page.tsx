import React from "react";

export default function PurchasingGuidePage() {
  return (
    <div>
      <h2 className="text-3xl font-medium tracking-tight uppercase mb-6">Hướng Dẫn Mua Hàng Trực Tuyến</h2>
      <ol className="list-decimal pl-6 space-y-3 text-sm text-neutral-700 dark:text-zinc-300">
        <li><strong>Bước 1:</strong> Tìm kiếm sản phẩm theo danh mục hoặc thông số kỹ thuật mong muốn.</li>
        <li><strong>Bước 2:</strong> Kiểm tra thông tin chi tiết, chọn số lượng và bấm <em>Thêm vào giỏ hàng</em> hoặc <em>Mua ngay</em>.</li>
        <li><strong>Bước 3:</strong> Điền thông tin giao hàng, áp dụng mã giảm giá (nếu có) và chọn phương thức thanh toán.</li>
        <li><strong>Bước 4:</strong> Xác nhận đơn hàng và theo dõi mã vận đơn qua email/sms.</li>
      </ol>
    </div>
  );
}
