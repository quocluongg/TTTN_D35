package ptithcm.tttnd35backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import ptithcm.tttnd35backend.config.security.UserPrincipal;
import ptithcm.tttnd35backend.dto.request.ProductReviewCreateRequest;
import ptithcm.tttnd35backend.dto.request.ProductReviewUpdateRequest;
import ptithcm.tttnd35backend.dto.response.ApiResponse;
import ptithcm.tttnd35backend.dto.response.ProductReviewResponse;
import ptithcm.tttnd35backend.dto.response.ReviewableOrderItemResponse;
import ptithcm.tttnd35backend.dto.response.pagination.PageResponse;
import ptithcm.tttnd35backend.service.IProductReviewService;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class ProductReviewController {

    private final IProductReviewService reviewService;

    // Public - trang chi tiết sản phẩm hiển thị review đã APPROVED (route đã public sẵn qua /products/**).
    @GetMapping("/products/{productId}/reviews")
    public ApiResponse<PageResponse<ProductReviewResponse>> getByProduct(
            @PathVariable UUID productId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.<PageResponse<ProductReviewResponse>>builder()
                .success(true)
                .data(reviewService.getByProduct(productId, page, size))
                .timestamp(LocalDateTime.now())
                .build();
    }

    @PostMapping("/products/{productId}/reviews")
    public ApiResponse<ProductReviewResponse> create(
            Authentication authentication, @PathVariable UUID productId,
            @RequestBody @Valid ProductReviewCreateRequest request) {
        return ApiResponse.<ProductReviewResponse>builder()
                .success(true)
                .message("Đã gửi đánh giá, chờ duyệt")
                .data(reviewService.create(productId, currentProfileId(authentication), request))
                .timestamp(LocalDateTime.now())
                .build();
    }

    @PutMapping("/reviews/{id}")
    public ApiResponse<ProductReviewResponse> update(
            Authentication authentication, @PathVariable UUID id,
            @RequestBody @Valid ProductReviewUpdateRequest request) {
        return ApiResponse.<ProductReviewResponse>builder()
                .success(true)
                .message("Cập nhật đánh giá thành công")
                .data(reviewService.update(id, currentProfileId(authentication), request))
                .timestamp(LocalDateTime.now())
                .build();
    }

    @DeleteMapping("/reviews/{id}")
    public ApiResponse<?> delete(Authentication authentication, @PathVariable UUID id) {
        reviewService.delete(id, currentProfileId(authentication));
        return ApiResponse.builder()
                .success(true)
                .message("Xóa đánh giá thành công")
                .timestamp(LocalDateTime.now())
                .build();
    }

    // Danh sách order_item khách đã mua (đơn COMPLETED) nhưng chưa review - FE dùng để biết có nên
    // hiện form review hay không (ẩn hoàn toàn nếu chưa mua/chưa hoàn tất).
    @GetMapping("/reviews/reviewable")
    public ApiResponse<List<ReviewableOrderItemResponse>> getReviewable(Authentication authentication) {
        return ApiResponse.<List<ReviewableOrderItemResponse>>builder()
                .success(true)
                .data(reviewService.getReviewableOrderItems(currentProfileId(authentication)))
                .timestamp(LocalDateTime.now())
                .build();
    }

    private UUID currentProfileId(Authentication authentication) {
        return ((UserPrincipal) authentication.getPrincipal()).getProfile().getId();
    }
}
