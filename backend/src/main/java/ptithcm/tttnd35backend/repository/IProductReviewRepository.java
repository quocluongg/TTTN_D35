package ptithcm.tttnd35backend.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import ptithcm.tttnd35backend.entity.ProductReview;
import ptithcm.tttnd35backend.repository.projection.ReviewAggregateProjection;
import ptithcm.tttnd35backend.util.enums.ReviewStatus;

import java.util.Optional;
import java.util.UUID;

public interface IProductReviewRepository extends JpaRepository<ProductReview, UUID>, JpaSpecificationExecutor<ProductReview> {

    boolean existsByOrderItemId(UUID orderItemId);

    // Guard sửa/xóa: chỉ chủ review mới thao tác được (ownership check ngay ở query).
    Optional<ProductReview> findByIdAndProfileId(UUID id, UUID profileId);

    Page<ProductReview> findAllByProductIdAndStatus(UUID productId, ReviewStatus status, Pageable pageable);

    // Recompute Product.ratingAvg/reviewCount mỗi khi admin đổi trạng thái review (xem ProductReviewServiceImpl).
    @Query("""
            SELECT AVG(r.rating) as avgRating, COUNT(r) as reviewCount
            FROM ProductReview r
            WHERE r.productId = :productId AND r.status = 'APPROVED'
            """)
    ReviewAggregateProjection aggregateApprovedByProduct(@Param("productId") UUID productId);

    // Danh sách order_item khách đã mua (đơn COMPLETED) nhưng chưa review lần mua đó -
    // phục vụ FE hỏi "tôi review được sản phẩm nào" (GET /reviews/reviewable).
    @Query("""
            SELECT new ptithcm.tttnd35backend.dto.response.ReviewableOrderItemResponse(
                oi.id, oi.productId, p.name, pv.variantName, o.createdAt)
            FROM OrderItem oi
            JOIN Order o ON oi.orderId = o.id
            JOIN Product p ON oi.productId = p.id
            LEFT JOIN ProductVariant pv ON oi.variantId = pv.id
            WHERE o.user.id = :profileId
              AND o.status = 'COMPLETED'
              AND oi.id NOT IN (SELECT r.orderItemId FROM ProductReview r)
            ORDER BY o.createdAt DESC
            """)
    java.util.List<ptithcm.tttnd35backend.dto.response.ReviewableOrderItemResponse> findReviewableOrderItems(
            @Param("profileId") UUID profileId);
}
