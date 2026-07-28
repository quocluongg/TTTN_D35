package ptithcm.tttnd35backend.service;

import ptithcm.tttnd35backend.dto.request.VoucherRequest;
import ptithcm.tttnd35backend.dto.request.VoucherValidateRequest;
import ptithcm.tttnd35backend.dto.response.VoucherResponse;
import ptithcm.tttnd35backend.dto.response.VoucherValidateResponse;

import java.util.List;
import java.util.UUID;

public interface IVoucherService {

    List<VoucherResponse> getAll();

    VoucherResponse getById(UUID id);

    VoucherResponse create(VoucherRequest request);

    VoucherResponse update(UUID id, VoucherRequest request);

    VoucherResponse setActive(UUID id, boolean active);

    /**
     * Kiểm tra mã có dùng được không (còn hạn, còn lượt tổng, đủ min_order_value) và tính số tiền giảm.
     * Chưa check được max_usage_per_user ở bước này vì bảng VoucherUsage chưa tồn tại (sẽ thêm cùng Order
     * ở giai đoạn 5) - việc check per-user + ghi nhận usage/tăng used_count sẽ bổ sung khi đó.
     * KHÔNG trừ lượt dùng ở đây - chỉ thật sự tính lượt khi Order được tạo, tránh giữ chỗ cho voucher
     * chưa chắc đã đặt hàng.
     */
    VoucherValidateResponse validate(VoucherValidateRequest request);
}
