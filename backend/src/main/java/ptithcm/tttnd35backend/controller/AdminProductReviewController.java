package ptithcm.tttnd35backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import ptithcm.tttnd35backend.dto.request.ReviewStatusRequest;
import ptithcm.tttnd35backend.dto.response.ApiResponse;
import ptithcm.tttnd35backend.dto.response.ProductReviewAdminResponse;
import ptithcm.tttnd35backend.dto.response.pagination.PageResponse;
import ptithcm.tttnd35backend.service.IProductReviewService;
import ptithcm.tttnd35backend.util.enums.ReviewStatus;

import java.time.LocalDateTime;
import java.util.UUID;

@RestController
@RequestMapping("/admin/reviews")
@RequiredArgsConstructor
public class AdminProductReviewController {

    private final IProductReviewService reviewService;

    @GetMapping
    @PreAuthorize("hasAuthority('REVIEW_MODERATE')")
    public ApiResponse<PageResponse<ProductReviewAdminResponse>> getList(
            @RequestParam(required = false) ReviewStatus status,
            @RequestParam(required = false) UUID productId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.<PageResponse<ProductReviewAdminResponse>>builder()
                .success(true)
                .data(reviewService.getListForAdmin(status, productId, page, size))
                .timestamp(LocalDateTime.now())
                .build();
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAuthority('REVIEW_MODERATE')")
    public ApiResponse<ProductReviewAdminResponse> setStatus(
            @PathVariable UUID id, @RequestBody @Valid ReviewStatusRequest request) {
        ProductReviewAdminResponse response = reviewService.moderate(id, request.getStatus());
        return ApiResponse.<ProductReviewAdminResponse>builder()
                .success(true)
                .message("Cập nhật trạng thái đánh giá thành công")
                .data(response)
                .timestamp(LocalDateTime.now())
                .build();
    }
}
