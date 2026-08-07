package ptithcm.tttnd35backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import ptithcm.tttnd35backend.dto.request.OrderStatusUpdateRequest;
import ptithcm.tttnd35backend.dto.response.ApiResponse;
import ptithcm.tttnd35backend.dto.response.OrderResponse;
import ptithcm.tttnd35backend.dto.response.pagination.PageResponse;
import ptithcm.tttnd35backend.service.IOrderService;
import ptithcm.tttnd35backend.util.enums.OrderStatus;

import java.time.LocalDateTime;
import java.util.UUID;

@RestController
@RequestMapping("/admin/orders")
@RequiredArgsConstructor
public class AdminOrderController {

    private final IOrderService orderService;

    @GetMapping
    @PreAuthorize("hasAuthority('ORDER_VIEW_ALL')")
    public ApiResponse<PageResponse<OrderResponse>> getAll(
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.<PageResponse<OrderResponse>>builder()
                .success(true)
                .data(orderService.getAllForAdmin(status, page, size))
                .timestamp(LocalDateTime.now())
                .build();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('ORDER_VIEW_ALL')")
    public ApiResponse<OrderResponse> getById(@PathVariable UUID id) {
        return ApiResponse.<OrderResponse>builder()
                .success(true)
                .data(orderService.getDetailForAdmin(id))
                .timestamp(LocalDateTime.now())
                .build();
    }

    // status=CANCELLED sẽ tự hoàn kho + hoàn voucher (xem OrderServiceImpl.updateStatus).
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAuthority('ORDER_UPDATE_STATUS')")
    public ApiResponse<OrderResponse> updateStatus(@PathVariable UUID id, @RequestBody @Valid OrderStatusUpdateRequest request) {
        return ApiResponse.<OrderResponse>builder()
                .success(true)
                .message("Đã cập nhật trạng thái đơn hàng")
                .data(orderService.updateStatus(id, request))
                .timestamp(LocalDateTime.now())
                .build();
    }
}
