import React from "react";

export default function PrivacyPolicyPage() {
  return (
    <div>
      <h2 className="text-3xl font-medium tracking-tight uppercase mb-6">Chính Sách Bảo Mật Thông Tin</h2>
      
      <p className="text-base text-neutral-600 dark:text-zinc-400 mb-6 leading-relaxed">
        Shopwise tôn trọng và cam kết bảo vệ thông tin cá nhân của người tiêu dùng khi truy cập và mua sắm tại hệ thống website của chúng tôi.
      </p>

      <h3 className="text-xl font-medium uppercase mt-8 mb-4">1. Mục Đích Thu Thập Thông Tin</h3>
      <p className="text-sm text-neutral-700 dark:text-zinc-300 leading-relaxed mb-4">
        Thông tin cá nhân thu thập (Họ tên, SĐT, Email, Địa chỉ giao hàng) chỉ phục vụ cho việc xử lý đơn hàng, giao hàng hoả tốc và kích hoạt thẻ bảo hành điện tử.
      </p>

      <h3 className="text-xl font-medium uppercase mt-8 mb-4">2. Cam Kết Bảo Mật</h3>
      <p className="text-sm text-neutral-700 dark:text-zinc-300 leading-relaxed mb-4">
        Mọi dữ liệu thanh toán và tài khoản người dùng được mã hóa an toàn theo tiêu chuẩn mã hóa SSL/TLS. Chúng tôi tuyệt đối không chia sẻ thông tin cho bên thứ ba vì mục đích thương mại.
      </p>
    </div>
  );
}
