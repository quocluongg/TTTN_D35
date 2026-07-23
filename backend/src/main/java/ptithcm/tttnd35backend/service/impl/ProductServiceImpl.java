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
            // Prevent duplicate products from joins
            query.distinct(true);

            List<Predicate> predicates = new ArrayList<>();

            // 1. Filter by category
            if (category != null && !category.trim().isEmpty() && !category.equalsIgnoreCase("Tất cả")) {
                predicates.add(criteriaBuilder.equal(root.get("category").get("name"), category));
            }

            // 2. Filter by maxPrice (joined from variants)
            if (maxPrice != null) {
                Join<Product, ProductVariant> variantsJoin = root.join("variants");
                predicates.add(criteriaBuilder.lessThanOrEqualTo(variantsJoin.get("price"), new BigDecimal(maxPrice)));
                // Only consider active variants with price > 0
                predicates.add(criteriaBuilder.greaterThan(variantsJoin.get("price"), BigDecimal.ZERO));
            }

            // 3. Filter by useCases keyword in name
            if (useCases != null && !useCases.isEmpty()) {
                List<Predicate> useCasePredicates = new ArrayList<>();
                for (String uc : useCases) {
                    if (uc.equalsIgnoreCase("Gaming")) {
                        useCasePredicates.add(criteriaBuilder.or(
                            criteriaBuilder.like(criteriaBuilder.lower(root.get("name")), "%gaming%"),
                            criteriaBuilder.like(criteriaBuilder.lower(root.get("name")), "%tuf%"),
                            criteriaBuilder.like(criteriaBuilder.lower(root.get("name")), "%playstation%"),
                            criteriaBuilder.like(criteriaBuilder.lower(root.get("name")), "%xbox%")
                        ));
                    } else if (uc.equalsIgnoreCase("Làm việc")) {
                        useCasePredicates.add(criteriaBuilder.or(
                            criteriaBuilder.like(criteriaBuilder.lower(root.get("name")), "%laptop%"),
                            criteriaBuilder.like(criteriaBuilder.lower(root.get("name")), "%acer%"),
                            criteriaBuilder.like(criteriaBuilder.lower(root.get("name")), "%lenovo%"),
                            criteriaBuilder.like(criteriaBuilder.lower(root.get("name")), "%ideapad%"),
                            criteriaBuilder.like(criteriaBuilder.lower(root.get("name")), "%chuột%"),
                            criteriaBuilder.like(criteriaBuilder.lower(root.get("name")), "%bàn phím%")
                        ));
                    } else if (uc.equalsIgnoreCase("Giải trí")) {
                        useCasePredicates.add(criteriaBuilder.and(
                            criteriaBuilder.notLike(criteriaBuilder.lower(root.get("name")), "%gaming%"),
                            criteriaBuilder.notLike(criteriaBuilder.lower(root.get("name")), "%tuf%"),
                            criteriaBuilder.notLike(criteriaBuilder.lower(root.get("name")), "%playstation%"),
                            criteriaBuilder.notLike(criteriaBuilder.lower(root.get("name")), "%xbox%"),
                            criteriaBuilder.notLike(criteriaBuilder.lower(root.get("name")), "%laptop%"),
                            criteriaBuilder.notLike(criteriaBuilder.lower(root.get("name")), "%acer%"),
                            criteriaBuilder.notLike(criteriaBuilder.lower(root.get("name")), "%lenovo%"),
                            criteriaBuilder.notLike(criteriaBuilder.lower(root.get("name")), "%ideapad%"),
                            criteriaBuilder.notLike(criteriaBuilder.lower(root.get("name")), "%chuột%"),
                            criteriaBuilder.notLike(criteriaBuilder.lower(root.get("name")), "%bàn phím%")
                        ));
                    }
                }
                predicates.add(criteriaBuilder.or(useCasePredicates.toArray(new Predicate[0])));
            }

            // 4. Filter by search keyword
            if (search != null && !search.trim().isEmpty()) {
                predicates.add(criteriaBuilder.like(criteriaBuilder.lower(root.get("name")), "%" + search.trim().toLowerCase() + "%"));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };

        // Fetch filtered list
        List<Product> products = productRepository.findAll(spec);

        // Map and sort in memory for accuracy with dynamic properties
        List<ProductResponse> responses = products.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        if (sortBy != null && !sortBy.trim().isEmpty()) {
            if (sortBy.equalsIgnoreCase("bestseller")) {
                responses.sort((a, b) -> Integer.compare(b.getReviewsCount(), a.getReviewsCount()));
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
        // Price resolution: get minimum price of active variants (> 0), fallback to 0 or a base price if all 0
        long price = 0L;
        if (product.getVariants() != null && !product.getVariants().isEmpty()) {
            price = product.getVariants().stream()
                    .map(ProductVariant::getPrice)
                    .filter(p -> p != null && p.compareTo(BigDecimal.ZERO) > 0)
                    .mapToLong(BigDecimal::longValue)
                    .min()
                    .orElse(0L);

            // If minimum active price is 0, just get the first variant's price
            if (price == 0L) {
                BigDecimal firstPrice = product.getVariants().get(0).getPrice();
                price = firstPrice != null ? firstPrice.longValue() : 0L;
            }
        }

        // Original price calculation
        Long originalPrice = null;
        BigDecimal dp = product.getDiscountPercent();
        if (dp == null && product.getVariants() != null && !product.getVariants().isEmpty()) {
            dp = product.getVariants().get(0).getDiscountPercent();
        }

        if (dp != null && dp.compareTo(BigDecimal.ZERO) > 0 && price > 0) {
            // Original = price / (1 - discount/100)
            BigDecimal factor = BigDecimal.ONE.subtract(dp.divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP));
            if (factor.compareTo(BigDecimal.ZERO) > 0) {
                originalPrice = new BigDecimal(price).divide(factor, 0, RoundingMode.HALF_UP).longValue();
            }
        }

        // Badges
        String discountBadge = (dp != null && dp.compareTo(BigDecimal.ZERO) > 0)
                ? "-" + dp.setScale(0, RoundingMode.HALF_UP) + "%"
                : null;

        String statusBadge = null;
        if (product.getId() % 6 == 0) {
            statusBadge = "Bán chạy";
        } else if (product.getId() % 8 == 0) {
            statusBadge = "Mới ra mắt";
        }

        // Dynamic use-case assignment
        String nameLower = product.getName().toLowerCase();
        String useCase = "Giải trí";
        if (nameLower.contains("gaming") || nameLower.contains("tuf") || nameLower.contains("playstation") || nameLower.contains("xbox")) {
            useCase = "Gaming";
        } else if (nameLower.contains("laptop") || nameLower.contains("acer") || nameLower.contains("lenovo") || nameLower.contains("ideapad") || nameLower.contains("chuột") || nameLower.contains("bàn phím")) {
            useCase = "Làm việc";
        }

        // Image resolution
        String imageUrl = product.getThumbnail();
        if (imageUrl == null || imageUrl.trim().isEmpty()) {
            imageUrl = "/figma/product_1.png"; // Fallback
        }

        return ProductResponse.builder()
                .id(product.getId().toString())
                .name(product.getName())
                .category(product.getCategory() != null ? product.getCategory().getName() : "Khác")
                .price(price)
                .originalPrice(originalPrice)
                .discountBadge(discountBadge)
                .statusBadge(statusBadge)
                .imageUrl(imageUrl)
                .rating(4.5 + (product.getId() % 6) * 0.1)
                .reviewsCount(5 + (int) (product.getId() % 45))
                .useCase(useCase)
                .isFeatured(product.getId() % 3 == 0)
                .description(product.getDescription())
                .build();
    }
}
