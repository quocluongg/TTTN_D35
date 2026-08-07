package ptithcm.tttnd35backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import ptithcm.tttnd35backend.config.security.UserPrincipal;
import ptithcm.tttnd35backend.dto.request.GuestOrderCreateRequest;
import ptithcm.tttnd35backend.dto.request.OrderCreateRequest;
import ptithcm.tttnd35backend.dto.response.ApiResponse;
import ptithcm.tttnd35backend.dto.response.OrderResponse;
import ptithcm.tttnd35backend.dto.response.pagination.PageResponse;
import ptithcm.tttnd35backend.service.IOrderService;

import java.time.LocalDateTime;
import java.util.UUID;

@RestController
@RequestMapping("/orders")
@RequiredArgsConstructor
public class OrderController {

    private final IOrderService orderService;

    // Checkout từ Cart - yêu cầu đăng nhập (catch-all authenticated() của SecurityConfig).
    @PostMapping
    public ApiResponse<OrderResponse> checkout(Authentication authentication, @RequestBody @Valid OrderCreateRequest request) {
        return ApiResponse.<OrderResponse>builder()
                .success(true)
                .message("Đặt hàng thành công")
                .data(orderService.checkout(currentProfileId(authentication), request))
                .timestamp(LocalDateTime.now())
                .build();
    }

    // Đặt hàng không cần đăng nhập - endpoint này nằm trong PUBLIC_ENDPOINTS của SecurityConfig.
    @PostMapping("/guest")
    public ApiResponse<OrderResponse> checkoutGuest(@RequestBody @Valid GuestOrderCreateRequest request) {
        return ApiResponse.<OrderResponse>builder()
                .success(true)
                .message("Đặt hàng thành công")
                .data(orderService.checkoutGuest(request))
                .timestamp(LocalDateTime.now())
                .build();
    }

    @GetMapping
    public ApiResponse<PageResponse<OrderResponse>> getMyOrders(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.<PageResponse<OrderResponse>>builder()
                .success(true)
                .data(orderService.getMyOrders(currentProfileId(authentication), page, size))
                .timestamp(LocalDateTime.now())
                .build();
    }

    @GetMapping("/{id}")
    public ApiResponse<OrderResponse> getMyOrderDetail(Authentication authentication, @PathVariable UUID id) {
        return ApiResponse.<OrderResponse>builder()
                .success(true)
                .data(orderService.getMyOrderDetail(currentProfileId(authentication), id))
                .timestamp(LocalDateTime.now())
                .build();
    }

    // Khách tự huỷ đơn - chỉ được khi đơn còn PENDING (xem OrderServiceImpl.cancelByCustomer).
    @PatchMapping("/{id}/cancel")
    public ApiResponse<OrderResponse> cancel(Authentication authentication, @PathVariable UUID id) {
        return ApiResponse.<OrderResponse>builder()
                .success(true)
                .message("Đã huỷ đơn hàng")
                .data(orderService.cancelByCustomer(currentProfileId(authentication), id))
                .timestamp(LocalDateTime.now())
                .build();
    }

    private UUID currentProfileId(Authentication authentication) {
        return ((UserPrincipal) authentication.getPrincipal()).getProfile().getId();
    }
}
