package ptithcm.tttnd35backend.service;

import ptithcm.tttnd35backend.dto.request.ProductReviewCreateRequest;
import ptithcm.tttnd35backend.dto.request.ProductReviewUpdateRequest;
import ptithcm.tttnd35backend.dto.response.ProductReviewAdminResponse;
import ptithcm.tttnd35backend.dto.response.ProductReviewResponse;
import ptithcm.tttnd35backend.dto.response.ReviewableOrderItemResponse;
import ptithcm.tttnd35backend.dto.response.pagination.PageResponse;
import ptithcm.tttnd35backend.util.enums.ReviewStatus;

import java.util.List;
import java.util.UUID;

public interface IProductReviewService {

    ProductReviewResponse create(UUID productId, UUID profileId, ProductReviewCreateRequest request);

    // Chỉ cho phép khi review còn PENDING và đúng chủ.
    ProductReviewResponse update(UUID reviewId, UUID profileId, ProductReviewUpdateRequest request);

    void delete(UUID reviewId, UUID profileId);

    // Public - chỉ trả review APPROVED.
    PageResponse<ProductReviewResponse> getByProduct(UUID productId, int page, int size);

    List<ReviewableOrderItemResponse> getReviewableOrderItems(UUID profileId);

    PageResponse<ProductReviewAdminResponse> getListForAdmin(ReviewStatus status, UUID productId, int page, int size);

    ProductReviewAdminResponse moderate(UUID reviewId, ReviewStatus status);
}
