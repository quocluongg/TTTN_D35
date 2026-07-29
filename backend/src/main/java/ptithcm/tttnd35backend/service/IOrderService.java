package ptithcm.tttnd35backend.service;

import ptithcm.tttnd35backend.dto.request.GuestOrderCreateRequest;
import ptithcm.tttnd35backend.dto.request.OrderCreateRequest;
import ptithcm.tttnd35backend.dto.request.OrderStatusUpdateRequest;
import ptithcm.tttnd35backend.dto.response.OrderResponse;
import ptithcm.tttnd35backend.dto.response.pagination.PageResponse;
import ptithcm.tttnd35backend.util.enums.OrderStatus;

import java.util.UUID;

public interface IOrderService {

    // Checkout từ Cart - bắt buộc đăng nhập. Trừ kho + áp voucher + xoá cart item trong 1 transaction.
    OrderResponse checkout(UUID profileId, OrderCreateRequest request);

    // Đặt hàng không cần đăng nhập - tự nhập sản phẩm trực tiếp, không đụng tới Cart.
    OrderResponse checkoutGuest(GuestOrderCreateRequest request);

    OrderResponse getMyOrderDetail(UUID profileId, UUID orderId);

    PageResponse<OrderResponse> getMyOrders(UUID profileId, int page, int size);

    OrderResponse getDetailForAdmin(UUID orderId);

    PageResponse<OrderResponse> getAllForAdmin(OrderStatus status, int page, int size);

    // Khách tự huỷ đơn của mình - chỉ cho phép khi status còn PENDING (chưa xử lý/giao).
    OrderResponse cancelByCustomer(UUID profileId, UUID orderId);

    // Admin cập nhật trạng thái/tracking. Nếu chuyển sang CANCELLED -> tự hoàn kho + hoàn voucher.
    OrderResponse updateStatus(UUID orderId, OrderStatusUpdateRequest request);
}
