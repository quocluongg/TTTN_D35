import React from "react";

export default function WarrantyPolicyPage() {
  return (
    <div>
      <h2 className="text-3xl font-medium tracking-tight uppercase mb-6">Chính Sách Bảo Hành & Đổi Trả</h2>
      
      <p className="text-base text-neutral-600 dark:text-zinc-400 mb-6 leading-relaxed">
        Shopwise cam kết tất cả sản phẩm phân phối đều là hàng chính hãng 100%. Quý khách hoàn toàn yên tâm khi sử dụng chính sách bảo hành uy tín từ chúng tôi.
      </p>

      <h3 className="text-xl font-medium uppercase mt-8 mb-4">1. Điều Kiện Được Bảo Hành</h3>
      <ul className="list-disc pl-6 space-y-2 text-sm text-neutral-700 dark:text-zinc-300">
        <li>Sản phẩm còn thời hạn bảo hành tính từ ngày mua ghi trên hóa đơn hoặc hệ thống tra cứu bảo hành điện tử.</li>
        <li>Tem niêm phong, tem bảo hành còn nguyên vẹn, không có dấu hiệu bị rách hay cạo sửa.</li>
        <li>Sản phẩm bị lỗi kỹ thuật do nhà sản xuất (không lên nguồn, sai số vượt mức quy định, hỏng cảm biến...).</li>
      </ul>

      <h3 className="text-xl font-medium uppercase mt-8 mb-4">2. Chính Sách 1 Đổi 1</h3>
      <p className="text-sm text-neutral-700 dark:text-zinc-300 leading-relaxed mb-4">
        Áp dụng 1 đổi 1 trong vòng 10 ngày đầu tiên kể từ khi nhận hàng nếu sản phẩm phát sinh lỗi do nhà sản xuất.
      </p>

      <h3 className="text-xl font-medium uppercase mt-8 mb-4">3. Trường Hợp Không Được Bảo Hành</h3>
      <ul className="list-disc pl-6 space-y-2 text-sm text-neutral-700 dark:text-zinc-300">
        <li>Sản phẩm bị rơi vỡ, biến dạng, vô nước hoặc hư hỏng do chập cháy điện lưới ngoài tầm kiểm soát.</li>
        <li>Sản phẩm đã bị tự ý tháo mở, sửa chữa bởi bên thứ ba không được ủy quyền.</li>
      </ul>
    </div>
  );
}
