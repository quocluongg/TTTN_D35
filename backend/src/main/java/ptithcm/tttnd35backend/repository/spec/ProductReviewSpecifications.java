package ptithcm.tttnd35backend.repository.spec;

import org.springframework.data.jpa.domain.Specification;
import ptithcm.tttnd35backend.entity.ProductReview;
import ptithcm.tttnd35backend.util.enums.ReviewStatus;

import java.util.UUID;

/** Build filter động cho GET /admin/reviews (status/productId). */
public class ProductReviewSpecifications {

    private ProductReviewSpecifications() {
    }

    public static Specification<ProductReview> hasStatus(ReviewStatus status) {
        if (status == null) {
            return null;
        }
        return (root, query, cb) -> cb.equal(root.get("status"), status);
    }

    public static Specification<ProductReview> hasProductId(UUID productId) {
        if (productId == null) {
            return null;
        }
        return (root, query, cb) -> cb.equal(root.get("productId"), productId);
    }
}
