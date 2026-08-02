package ptithcm.tttnd35backend.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ptithcm.tttnd35backend.dto.response.ProductResponse;
import ptithcm.tttnd35backend.entity.Category;
import ptithcm.tttnd35backend.entity.Product;
import ptithcm.tttnd35backend.entity.ProductVariant;
import ptithcm.tttnd35backend.repository.ICategoryRepository;
import ptithcm.tttnd35backend.repository.IProductRepository;
import ptithcm.tttnd35backend.service.IProductService;

import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductServiceImpl implements IProductService {

    private final IProductRepository productRepository;
    private final ICategoryRepository categoryRepository;

    @Override
    public List<ProductResponse> getProducts(String category, List<String> useCases, Long maxPrice, String sortBy, String search) {
        Specification<Product> spec = (root, query, criteriaBuilder) -> {
            query.distinct(true);

            List<Predicate> predicates = new ArrayList<>();

            // 0. Only active products
            predicates.add(criteriaBuilder.or(
                criteriaBuilder.isNull(root.get("isActive")),
                criteriaBuilder.equal(root.get("isActive"), true)
            ));

            // 1. Filter by category
            if (category != null && !category.trim().isEmpty() && !category.equalsIgnoreCase("Tất cả")) {
                predicates.add(criteriaBuilder.equal(root.get("category").get("name"), category));
            }

            // 2. Filter by maxPrice (joined from variants)
            if (maxPrice != null) {
                Join<Product, ProductVariant> variantsJoin = root.join("variants");
                predicates.add(criteriaBuilder.lessThanOrEqualTo(variantsJoin.get("price"), new BigDecimal(maxPrice)));
                predicates.add(criteriaBuilder.greaterThan(variantsJoin.get("price"), BigDecimal.ZERO));
            }

            // 3. Filter by useCases
            if (useCases != null && !useCases.isEmpty()) {
                List<Predicate> useCasePredicates = new ArrayList<>();
                for (String uc : useCases) {
                    if (uc != null && !uc.trim().isEmpty()) {
                        String ucLower = uc.trim().toLowerCase();
                        useCasePredicates.add(criteriaBuilder.equal(criteriaBuilder.lower(root.get("useCase")), ucLower));
                        useCasePredicates.add(criteriaBuilder.like(criteriaBuilder.lower(root.get("name")), "%" + ucLower + "%"));
                    }
                }
                if (!useCasePredicates.isEmpty()) {
                    predicates.add(criteriaBuilder.or(useCasePredicates.toArray(new Predicate[0])));
                }
            }

            // 4. Filter by search keyword
            if (search != null && !search.trim().isEmpty()) {
                predicates.add(criteriaBuilder.like(criteriaBuilder.lower(root.get("name")), "%" + search.trim().toLowerCase() + "%"));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };

        List<Product> products = productRepository.findAll(spec);

        List<ProductResponse> responses = products.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        if (sortBy != null && !sortBy.trim().isEmpty()) {
            if (sortBy.equalsIgnoreCase("bestseller")) {
                responses.sort((a, b) -> Integer.compare(
                    b.getSoldQuantity() != null ? b.getSoldQuantity() : (b.getReviewsCount() != null ? b.getReviewsCount() : 0),
                    a.getSoldQuantity() != null ? a.getSoldQuantity() : (a.getReviewsCount() != null ? a.getReviewsCount() : 0)
                ));
            } else if (sortBy.equalsIgnoreCase("price-low")) {
                responses.sort((a, b) -> Long.compare(a.getPrice(), b.getPrice()));
            } else if (sortBy.equalsIgnoreCase("price-high")) {
                responses.sort((a, b) -> Long.compare(b.getPrice(), a.getPrice()));
            } else if (sortBy.equalsIgnoreCase("featured")) {
                responses.sort((a, b) -> Boolean.compare(b.isFeatured(), a.isFeatured()));
            }
        }

        return responses;
    }

    @Override
    public List<String> getAllCategoryNames() {
        return categoryRepository.findAll().stream()
                .map(Category::getName)
                .collect(Collectors.toList());
    }

    private ProductResponse mapToResponse(Product product) {
        long price = 0L;
        if (product.getVariants() != null && !product.getVariants().isEmpty()) {
            price = product.getVariants().stream()
                    .map(ProductVariant::getPrice)
                    .filter(p -> p != null && p.compareTo(BigDecimal.ZERO) > 0)
                    .mapToLong(BigDecimal::longValue)
                    .min()
                    .orElse(0L);

            if (price == 0L) {
                BigDecimal firstPrice = product.getVariants().get(0).getPrice();
                price = firstPrice != null ? firstPrice.longValue() : 0L;
            }
        }

        Long originalPrice = null;
        BigDecimal dp = product.getDiscountPercent();
        if (dp == null && product.getVariants() != null && !product.getVariants().isEmpty()) {
            dp = product.getVariants().get(0).getDiscountPercent();
        }

        if (dp != null && dp.compareTo(BigDecimal.ZERO) > 0 && price > 0) {
            BigDecimal factor = BigDecimal.ONE.subtract(dp.divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP));
            if (factor.compareTo(BigDecimal.ZERO) > 0) {
                originalPrice = new BigDecimal(price).divide(factor, 0, RoundingMode.HALF_UP).longValue();
            }
        }

        String discountBadge = (dp != null && dp.compareTo(BigDecimal.ZERO) > 0)
                ? "-" + dp.setScale(0, RoundingMode.HALF_UP) + "%"
                : null;

        Integer soldQty = product.getSoldQuantity() != null ? product.getSoldQuantity() : 0;
        String statusBadge = null;
        if (soldQty > 15) {
            statusBadge = "Bán chạy";
        } else if (product.getCreatedAt() != null) {
            statusBadge = "Mới ra mắt";
        }

        String useCase = product.getUseCase();
        if (useCase == null || useCase.trim().isEmpty()) {
            String nameLower = product.getName().toLowerCase();
            if (nameLower.contains("gaming") || nameLower.contains("tuf") || nameLower.contains("playstation") || nameLower.contains("xbox")) {
                useCase = "Gaming";
            } else if (nameLower.contains("laptop") || nameLower.contains("acer") || nameLower.contains("lenovo") || nameLower.contains("ideapad") || nameLower.contains("chuột") || nameLower.contains("bàn phím")) {
                useCase = "Làm việc";
            } else {
                useCase = "Giải trí";
            }
        }

        String imageUrl = product.getThumbnail();
        if (imageUrl == null || imageUrl.trim().isEmpty()) {
            imageUrl = "/figma/product_1.png";
        }

        Double rating = product.getRatingAvg() != null ? product.getRatingAvg().doubleValue() : 5.0;
        Integer reviewsCount = product.getReviewCount() != null ? product.getReviewCount() : 0;

        return ProductResponse.builder()
                .id(product.getId().toString())
                .name(product.getName())
                .category(product.getCategory() != null ? product.getCategory().getName() : "Khác")
                .price(price)
                .originalPrice(originalPrice)
                .discountBadge(discountBadge)
                .statusBadge(statusBadge)
                .imageUrl(imageUrl)
                .rating(rating)
                .reviewsCount(reviewsCount)
                .soldQuantity(soldQty)
                .useCase(useCase)
                .isFeatured(soldQty > 10 || (product.getId().hashCode() % 3 == 0))
                .description(product.getDescription())
                .build();
    }
}
