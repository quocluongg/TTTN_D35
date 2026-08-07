package ptithcm.tttnd35backend.repository.spec;

import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;
import ptithcm.tttnd35backend.entity.Product;

import java.math.BigDecimal;
import java.util.Map;

/**
 * Build filter động cho GET /products (category/brand/price/search) trong 1 query duy nhất
 * thay vì if-else viết nhiều method findByXxx riêng lẻ ở repository.
 */
public class ProductSpecifications {

    private ProductSpecifications() {
    }

    public static Specification<Product> isActive() {
        return (root, query, cb) -> cb.isTrue(root.get("isActive"));
    }

    public static Specification<Product> hasCategorySlug(String categorySlug) {
        if (!StringUtils.hasText(categorySlug)) {
            return null;
        }
        return (root, query, cb) -> cb.equal(root.get("category").get("slug"), categorySlug);
    }

    public static Specification<Product> hasBrand(String brand) {
        if (!StringUtils.hasText(brand)) {
            return null;
        }
        return (root, query, cb) -> cb.equal(cb.lower(root.get("brand")), brand.toLowerCase());
    }

    public static Specification<Product> hasUseCase(String useCase) {
        if (!StringUtils.hasText(useCase)) {
            return null;
        }
        return (root, query, cb) -> cb.equal(cb.lower(root.get("useCase")), useCase.trim().toLowerCase());
    }

    public static Specification<Product> nameContains(String search) {
        if (!StringUtils.hasText(search)) {
            return null;
        }
        String pattern = "%" + search.trim().toLowerCase() + "%";
        return (root, query, cb) -> cb.like(cb.lower(root.get("name")), pattern);
    }

    // minPrice/maxPrice lọc trên priceFrom (MIN giá variant), nên phải join sang product_variants.
    // Dùng subquery thay vì join trực tiếp để không làm nhân dòng Product theo số lượng variant.
    public static Specification<Product> priceFromBetween(BigDecimal minPrice, BigDecimal maxPrice) {
        if (minPrice == null && maxPrice == null) {
            return null;
        }
        return (root, query, cb) -> {
            // Correlated subquery: MIN(price) của các variant thuộc đúng product đang xét ở query ngoài.
            var minSubquery = query.subquery(BigDecimal.class);
            var vRoot = minSubquery.from(ptithcm.tttnd35backend.entity.ProductVariant.class);
            minSubquery.select(cb.min(vRoot.get("price")))
                    .where(cb.equal(vRoot.get("productId"), root.get("id")));

            var predicate = cb.conjunction();
            if (minPrice != null) {
                predicate = cb.and(predicate, cb.greaterThanOrEqualTo(minSubquery, minPrice));
            }
            if (maxPrice != null) {
                predicate = cb.and(predicate, cb.lessThanOrEqualTo(minSubquery, maxPrice));
            }
            return predicate;
        };
    }

    public static Specification<Product> hasCategoryIds(java.util.List<java.util.UUID> categoryIds) {
        if (categoryIds == null || categoryIds.isEmpty()) {
            return null;
        }
        return (root, query, cb) -> root.get("category").get("id").in(categoryIds);
    }

    // Sort theo giá thấp nhất của variant. Set trực tiếp query.orderBy() trong toPredicate() (thay vì
    // qua Pageable Sort) vì Sort không biết cách diễn đạt "sort theo subquery" - đây là cách chuẩn để
    // làm ORDER BY theo 1 cột không nằm trên chính bảng Product. Trả về cb.conjunction() vì spec này
    // không lọc gì, chỉ có tác dụng phụ set order.
    public static Specification<Product> orderByMinPrice(boolean ascending) {
        return (root, query, cb) -> {
            var minSubquery = query.subquery(BigDecimal.class);
            var vRoot = minSubquery.from(ptithcm.tttnd35backend.entity.ProductVariant.class);
            minSubquery.select(cb.min(vRoot.get("price")))
                    .where(cb.equal(vRoot.get("productId"), root.get("id")));

            query.orderBy(ascending ? cb.asc(minSubquery) : cb.desc(minSubquery));
            return cb.conjunction();
        };
    }

    /** Giữ lại cho tương thích - lọc theo đúng 1 cặp spec (key/value chấp nhận match một phần). */
    public static Specification<Product> hasSpec(String key, String value) {
        if (!StringUtils.hasText(key) || !StringUtils.hasText(value)) {
            return null;
        }
        return (root, query, cb) -> {
            var subquery = query.subquery(java.util.UUID.class);
            var specRoot = subquery.from(ptithcm.tttnd35backend.entity.ProductSpecification.class);
            var attrKeyJoin = specRoot.join("attributeKey");

            String keyPattern = "%" + key.trim().toLowerCase() + "%";
            String valuePattern = "%" + value.trim().toLowerCase() + "%";

            var keyPredicate = cb.or(
                    cb.like(cb.lower(attrKeyJoin.get("name")), keyPattern),
                    cb.like(cb.lower(attrKeyJoin.get("displayName")), keyPattern)
            );
            var valuePredicate = cb.like(cb.lower(specRoot.get("specValue")), valuePattern);

            subquery.select(specRoot.get("productId"))
                    .where(cb.equal(specRoot.get("productId"), root.get("id")), keyPredicate, valuePredicate);

            return cb.exists(subquery);
        };
    }

    /**
     * Lọc nhiều spec cùng lúc kiểu AND (vd RAM=16GB AND CPU=i5): mỗi cặp key/value là 1 EXISTS
     * subquery riêng (không gộp chung 1 subquery) vì attributeKey/specValue nằm trên nhiều dòng
     * ProductSpecification khác nhau của cùng 1 product - gộp chung sẽ ra sai kết quả (không dòng
     * nào thỏa hết tất cả điều kiện cùng lúc).
     */
    public static Specification<Product> hasAllSpecs(Map<String, String> specs) {
        if (specs == null || specs.isEmpty()) {
            return null;
        }
        Specification<Product> combined = null;
        for (Map.Entry<String, String> entry : specs.entrySet()) {
            Specification<Product> single = hasSpec(entry.getKey(), entry.getValue());
            if (single == null) {
                continue;
            }
            combined = combined == null ? single : combined.and(single);
        }
        return combined;
    }
}
