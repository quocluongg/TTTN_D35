package ptithcm.tttnd35backend.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import ptithcm.tttnd35backend.dto.request.ProductReviewCreateRequest;
import ptithcm.tttnd35backend.dto.request.ProductReviewUpdateRequest;
import ptithcm.tttnd35backend.dto.response.ProductReviewAdminResponse;
import ptithcm.tttnd35backend.dto.response.ProductReviewResponse;
import ptithcm.tttnd35backend.dto.response.ReviewableOrderItemResponse;
import ptithcm.tttnd35backend.dto.response.pagination.PageResponse;
import ptithcm.tttnd35backend.entity.Order;
import ptithcm.tttnd35backend.entity.OrderItem;
import ptithcm.tttnd35backend.entity.Product;
import ptithcm.tttnd35backend.entity.ProductReview;
import ptithcm.tttnd35backend.entity.Profile;
import ptithcm.tttnd35backend.exception.BadRequestException;
import ptithcm.tttnd35backend.exception.ResourceNotFoundException;
import ptithcm.tttnd35backend.mapper.ProductReviewMapper;
import ptithcm.tttnd35backend.repository.IOrderItemRepository;
import ptithcm.tttnd35backend.repository.IOrderRepository;
import ptithcm.tttnd35backend.repository.IProductRepository;
import ptithcm.tttnd35backend.repository.IProductReviewRepository;
import ptithcm.tttnd35backend.repository.IProfileRepository;
import ptithcm.tttnd35backend.repository.projection.ReviewAggregateProjection;
import ptithcm.tttnd35backend.repository.spec.ProductReviewSpecifications;
import ptithcm.tttnd35backend.service.IProductReviewService;
import ptithcm.tttnd35backend.util.enums.OrderStatus;
import ptithcm.tttnd35backend.util.enums.ReviewStatus;
import ptithcm.tttnd35backend.util.helper.PageResponseHelper;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProductReviewServiceImpl implements IProductReviewService {

    private final IProductReviewRepository reviewRepository;
    private final IOrderItemRepository orderItemRepository;
    private final IOrderRepository orderRepository;
    private final IProductRepository productRepository;
    private final IProfileRepository profileRepository;

    private final ProductReviewMapper reviewMapper;

    @Override
    @Transactional
    public ProductReviewResponse create(UUID productId, UUID profileId, ProductReviewCreateRequest request) {
        OrderItem orderItem = orderItemRepository.findById(request.getOrderItemId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lần mua hàng này"));

        if (!orderItem.getProductId().equals(productId)) {
            throw new BadRequestException("Sản phẩm không khớp với lần mua hàng đã chọn");
        }

        Order order = orderRepository.findByIdAndUserId(orderItem.getOrderId(), profileId)
                .orElseThrow(() -> new BadRequestException("Đơn hàng không thuộc về bạn"));

        if (order.getStatus() != OrderStatus.COMPLETED) {
            throw new BadRequestException("Chỉ có thể đánh giá sau khi đơn hàng đã hoàn tất");
        }

        if (reviewRepository.existsByOrderItemId(orderItem.getId())) {
            throw new BadRequestException("Bạn đã đánh giá lần mua hàng này rồi");
        }

        ProductReview review = reviewMapper.toEntity(request);
        review.setProductId(productId);
        review.setOrderItemId(orderItem.getId());
        review.setProfileId(profileId);
        review.setStatus(ReviewStatus.PENDING);
        review = reviewRepository.save(review);

        return enrichPublic(review, loadProfile(profileId));
    }

    @Override
    @Transactional
    public ProductReviewResponse update(UUID reviewId, UUID profileId, ProductReviewUpdateRequest request) {
        ProductReview review = reviewRepository.findByIdAndProfileId(reviewId, profileId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đánh giá"));

        if (review.getStatus() != ReviewStatus.PENDING) {
            throw new BadRequestException("Chỉ có thể sửa đánh giá khi chưa được duyệt");
        }

        reviewMapper.updateEntityFromRequest(request, review);
        review = reviewRepository.save(review);

        return enrichPublic(review, loadProfile(profileId));
    }

    @Override
    @Transactional
    public void delete(UUID reviewId, UUID profileId) {
        ProductReview review = reviewRepository.findByIdAndProfileId(reviewId, profileId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đánh giá"));

        if (review.getStatus() != ReviewStatus.PENDING) {
            throw new BadRequestException("Chỉ có thể xóa đánh giá khi chưa được duyệt");
        }

        reviewRepository.delete(review);
    }

    @Override
    public PageResponse<ProductReviewResponse> getByProduct(UUID productId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        var pageResult = reviewRepository.findAllByProductIdAndStatus(productId, ReviewStatus.APPROVED, pageable);

        Map<UUID, Profile> profileById = loadProfiles(pageResult.getContent().stream()
                .map(ProductReview::getProfileId).toList());

        var items = pageResult.map(review -> enrichPublic(review, profileById.get(review.getProfileId())));
        return PageResponseHelper.toPageResponse(items);
    }

    @Override
    public List<ReviewableOrderItemResponse> getReviewableOrderItems(UUID profileId) {
        return reviewRepository.findReviewableOrderItems(profileId);
    }

    @Override
    public PageResponse<ProductReviewAdminResponse> getListForAdmin(ReviewStatus status, UUID productId, int page, int size) {
        Specification<ProductReview> spec = Specification.allOf(
                nonNull(ProductReviewSpecifications.hasStatus(status)),
                nonNull(ProductReviewSpecifications.hasProductId(productId))
        );
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        var pageResult = reviewRepository.findAll(spec, pageable);

        List<ProductReview> content = pageResult.getContent();
        Map<UUID, Profile> profileById = loadProfiles(content.stream().map(ProductReview::getProfileId).toList());
        Map<UUID, String> productNameById = loadProductNames(content.stream().map(ProductReview::getProductId).toList());

        var items = pageResult.map(review -> {
            ProductReviewAdminResponse response = reviewMapper.toAdminResponse(review);
            Profile profile = profileById.get(review.getProfileId());
            response.setReviewerName(profile != null ? profile.getFullName() : null);
            response.setReviewerEmail(profile != null ? profile.getEmail() : null);
            response.setProductName(productNameById.get(review.getProductId()));
            return response;
        });
        return PageResponseHelper.toPageResponse(items);
    }

    @Override
    @Transactional
    public ProductReviewAdminResponse moderate(UUID reviewId, ReviewStatus status) {
        ProductReview review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đánh giá"));

        review.setStatus(status);
        review = reviewRepository.save(review);

        recomputeProductRating(review.getProductId());

        Profile profile = loadProfile(review.getProfileId());
        Product product = productRepository.findById(review.getProductId()).orElse(null);

        ProductReviewAdminResponse response = reviewMapper.toAdminResponse(review);
        response.setReviewerName(profile != null ? profile.getFullName() : null);
        response.setReviewerEmail(profile != null ? profile.getEmail() : null);
        response.setProductName(product != null ? product.getName() : null);
        return response;
    }

    // ===== Helper =====

    private void recomputeProductRating(UUID productId) {
        ReviewAggregateProjection agg = reviewRepository.aggregateApprovedByProduct(productId);
        BigDecimal avg = (agg != null && agg.getAvgRating() != null)
                ? agg.getAvgRating().setScale(1, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
        int count = (agg != null && agg.getReviewCount() != null) ? agg.getReviewCount().intValue() : 0;
        productRepository.updateRatingAggregate(productId, avg, count);
    }

    private ProductReviewResponse enrichPublic(ProductReview review, Profile profile) {
        ProductReviewResponse response = reviewMapper.toResponse(review);
        response.setReviewerName(resolveDisplayName(profile));
        return response;
    }

    private String resolveDisplayName(Profile profile) {
        if (profile == null) {
            return "Khách hàng";
        }
        return StringUtils.hasText(profile.getFullName()) ? profile.getFullName() : profile.getEmail();
    }

    private Profile loadProfile(UUID profileId) {
        return profileRepository.findById(profileId).orElse(null);
    }

    private Map<UUID, Profile> loadProfiles(List<UUID> profileIds) {
        if (profileIds.isEmpty()) {
            return Map.of();
        }
        Map<UUID, Profile> result = new HashMap<>();
        for (Profile profile : profileRepository.findAllById(profileIds)) {
            result.put(profile.getId(), profile);
        }
        return result;
    }

    private Map<UUID, String> loadProductNames(List<UUID> productIds) {
        if (productIds.isEmpty()) {
            return Map.of();
        }
        Map<UUID, String> result = new HashMap<>();
        for (Product product : productRepository.findAllById(productIds)) {
            result.put(product.getId(), product.getName());
        }
        return result;
    }

    private Specification<ProductReview> nonNull(Specification<ProductReview> spec) {
        return spec == null ? Specification.allOf() : spec;
    }
}
