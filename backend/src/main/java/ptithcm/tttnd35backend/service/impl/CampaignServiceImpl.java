package ptithcm.tttnd35backend.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ptithcm.tttnd35backend.dto.request.CampaignItemRequest;
import ptithcm.tttnd35backend.dto.request.CampaignRequest;
import ptithcm.tttnd35backend.dto.response.CampaignItemResponse;
import ptithcm.tttnd35backend.dto.response.CampaignResponse;
import ptithcm.tttnd35backend.entity.Campaign;
import ptithcm.tttnd35backend.entity.CampaignItem;
import ptithcm.tttnd35backend.entity.Product;
import ptithcm.tttnd35backend.entity.ProductVariant;
import ptithcm.tttnd35backend.exception.BadRequestException;
import ptithcm.tttnd35backend.exception.DuplicateResourceException;
import ptithcm.tttnd35backend.exception.ResourceNotFoundException;
import ptithcm.tttnd35backend.mapper.CampaignMapper;
import ptithcm.tttnd35backend.repository.ICampaignItemRepository;
import ptithcm.tttnd35backend.repository.ICampaignRepository;
import ptithcm.tttnd35backend.repository.IProductRepository;
import ptithcm.tttnd35backend.repository.IProductVariantRepository;
import ptithcm.tttnd35backend.service.ICampaignService;
import ptithcm.tttnd35backend.util.enums.DiscountType;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CampaignServiceImpl implements ICampaignService {

    private final ICampaignRepository campaignRepository;
    private final ICampaignItemRepository campaignItemRepository;
    private final IProductVariantRepository productVariantRepository;
    private final IProductRepository productRepository;
    private final CampaignMapper campaignMapper;

    @Override
    @Transactional(readOnly = true)
    public List<CampaignResponse> getAll() {
        return campaignRepository.findAllByOrderByStartTimeDesc().stream()
                .map(this::toResponseWithRunningFlag)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public CampaignResponse getById(UUID id) {
        return toResponseWithRunningFlag(loadCampaign(id));
    }

    @Override
    @Transactional
    public CampaignResponse create(CampaignRequest request) {
        validateTimeRange(request.getStartTime(), request.getEndTime());

        Campaign campaign = campaignMapper.toEntity(request);
        return toResponseWithRunningFlag(campaignRepository.save(campaign));
    }

    @Override
    @Transactional
    public CampaignResponse update(UUID id, CampaignRequest request) {
        validateTimeRange(request.getStartTime(), request.getEndTime());

        Campaign campaign = loadCampaign(id);
        campaignMapper.updateEntityFromRequest(request, campaign);
        return toResponseWithRunningFlag(campaignRepository.save(campaign));
    }

    @Override
    @Transactional
    public CampaignResponse setActive(UUID id, boolean active) {
        Campaign campaign = loadCampaign(id);
        campaign.setActive(active);
        return toResponseWithRunningFlag(campaignRepository.save(campaign));
    }

    @Override
    @Transactional(readOnly = true)
    public List<CampaignItemResponse> getItems(UUID campaignId) {
        loadCampaign(campaignId); // đảm bảo campaign tồn tại, 404 sớm nếu id sai

        List<CampaignItem> items = campaignItemRepository.findAllByCampaignId(campaignId);
        return toItemResponses(items);
    }

    @Override
    @Transactional
    public CampaignItemResponse addItem(UUID campaignId, CampaignItemRequest request) {
        loadCampaign(campaignId);
        validateDiscountValue(request.getDiscountType(), request.getDiscountValue());

        if (campaignItemRepository.existsByCampaignIdAndVariantId(campaignId, request.getVariantId())) {
            throw new DuplicateResourceException("Biến thể này đã có trong đợt khuyến mãi");
        }
        ProductVariant variant = loadVariant(request.getVariantId());

        CampaignItem item = CampaignItem.builder()
                .campaignId(campaignId)
                .variantId(variant.getId())
                .discountType(request.getDiscountType())
                .discountValue(request.getDiscountValue())
                .build();
        campaignItemRepository.save(item);

        return toItemResponses(List.of(item)).get(0);
    }

    @Override
    @Transactional
    public CampaignItemResponse updateItem(UUID campaignId, UUID itemId, CampaignItemRequest request) {
        validateDiscountValue(request.getDiscountType(), request.getDiscountValue());

        CampaignItem item = campaignItemRepository.findByIdAndCampaignId(itemId, campaignId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy mục khuyến mãi"));

        // Đổi sang variant khác thì phải check trùng, giữ nguyên variant thì bỏ qua check với chính nó.
        if (!item.getVariantId().equals(request.getVariantId())
                && campaignItemRepository.existsByCampaignIdAndVariantId(campaignId, request.getVariantId())) {
            throw new DuplicateResourceException("Biến thể này đã có trong đợt khuyến mãi");
        }

        ProductVariant variant = loadVariant(request.getVariantId());
        item.setVariantId(variant.getId());
        item.setDiscountType(request.getDiscountType());
        item.setDiscountValue(request.getDiscountValue());
        campaignItemRepository.save(item);

        return toItemResponses(List.of(item)).get(0);
    }

    @Override
    @Transactional
    public void deleteItem(UUID campaignId, UUID itemId) {
        CampaignItem item = campaignItemRepository.findByIdAndCampaignId(itemId, campaignId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy mục khuyến mãi"));
        campaignItemRepository.delete(item);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<UUID, BigDecimal> getActiveSalePrices(Set<UUID> variantIds) {
        if (variantIds.isEmpty()) {
            return Map.of();
        }

        List<CampaignItem> activeItems = campaignItemRepository.findActiveByVariantIds(variantIds, LocalDateTime.now());
        if (activeItems.isEmpty()) {
            return Map.of();
        }

        Map<UUID, ProductVariant> variantById = productVariantRepository
                .findAllById(activeItems.stream().map(CampaignItem::getVariantId).collect(Collectors.toSet()))
                .stream().collect(Collectors.toMap(ProductVariant::getId, v -> v));

        Map<UUID, BigDecimal> result = new LinkedHashMap<>();
        for (CampaignItem item : activeItems) {
            ProductVariant variant = variantById.get(item.getVariantId());
            if (variant == null) {
                continue;
            }
            // 1 variant có thể nằm trong nhiều campaign đang chạy cùng lúc (hiếm nhưng không cấm) -
            // ưu tiên giá thấp nhất, có lợi cho khách.
            BigDecimal salePrice = computeSalePrice(variant.getPrice(), item.getDiscountType(), item.getDiscountValue());
            result.merge(item.getVariantId(), salePrice, BigDecimal::min);
        }
        return result;
    }

    // ===== Helper =====

    private Campaign loadCampaign(UUID id) {
        return campaignRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đợt khuyến mãi"));
    }

    private ProductVariant loadVariant(UUID variantId) {
        return productVariantRepository.findById(variantId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy biến thể sản phẩm"));
    }

    private void validateTimeRange(LocalDateTime start, LocalDateTime end) {
        if (!end.isAfter(start)) {
            throw new BadRequestException("Thời gian kết thúc phải sau thời gian bắt đầu");
        }
    }

    private void validateDiscountValue(DiscountType type, BigDecimal value) {
        if (type == DiscountType.PERCENT && value.compareTo(BigDecimal.valueOf(100)) > 0) {
            throw new BadRequestException("Giảm theo % không được vượt quá 100");
        }
    }

    private BigDecimal computeSalePrice(BigDecimal originalPrice, DiscountType type, BigDecimal value) {
        BigDecimal salePrice = type == DiscountType.PERCENT
                ? originalPrice.multiply(BigDecimal.ONE.subtract(value.divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP)))
                : originalPrice.subtract(value);
        return salePrice.max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
    }

    private CampaignResponse toResponseWithRunningFlag(Campaign campaign) {
        CampaignResponse response = campaignMapper.toResponse(campaign);
        LocalDateTime now = LocalDateTime.now();
        response.setCurrentlyRunning(campaign.isActive()
                && !now.isBefore(campaign.getStartTime()) && !now.isAfter(campaign.getEndTime()));
        return response;
    }

    // Batch-load variant + product theo id, tránh N+1 dù danh sách item bao nhiêu dòng.
    private List<CampaignItemResponse> toItemResponses(List<CampaignItem> items) {
        if (items.isEmpty()) {
            return List.of();
        }

        Map<UUID, ProductVariant> variantById = productVariantRepository
                .findAllById(items.stream().map(CampaignItem::getVariantId).collect(Collectors.toSet()))
                .stream().collect(Collectors.toMap(ProductVariant::getId, v -> v));

        Map<UUID, Product> productById = productRepository
                .findAllById(variantById.values().stream().map(ProductVariant::getProductId).collect(Collectors.toSet()))
                .stream().collect(Collectors.toMap(Product::getId, p -> p));

        return items.stream().map(item -> {
            ProductVariant variant = variantById.get(item.getVariantId());
            Product product = variant != null ? productById.get(variant.getProductId()) : null;
            BigDecimal originalPrice = variant != null ? variant.getPrice() : BigDecimal.ZERO;

            return CampaignItemResponse.builder()
                    .id(item.getId())
                    .variantId(item.getVariantId())
                    .sku(variant != null ? variant.getSku() : null)
                    .variantName(variant != null ? variant.getVariantName() : null)
                    .productName(product != null ? product.getName() : null)
                    .originalPrice(originalPrice)
                    .discountType(item.getDiscountType())
                    .discountValue(item.getDiscountValue())
                    .salePrice(computeSalePrice(originalPrice, item.getDiscountType(), item.getDiscountValue()))
                    .build();
        }).toList();
    }
}
