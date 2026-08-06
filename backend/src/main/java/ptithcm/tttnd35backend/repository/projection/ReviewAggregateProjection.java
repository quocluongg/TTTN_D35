package ptithcm.tttnd35backend.repository.projection;

import java.math.BigDecimal;

/** Kết quả aggregate AVG(rating)/COUNT(*) của review APPROVED theo 1 product, dùng để recompute Product.ratingAvg/reviewCount. */
public interface ReviewAggregateProjection {
    BigDecimal getAvgRating();
    Long getReviewCount();
}
