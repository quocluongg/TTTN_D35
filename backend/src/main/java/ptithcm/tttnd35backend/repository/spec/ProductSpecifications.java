package ptithcm.tttnd35backend.repository.spec;

import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;
import ptithcm.tttnd35backend.entity.Product;

import java.math.BigDecimal;

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
}
