package ptithcm.tttnd35backend.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ptithcm.tttnd35backend.dto.request.InventoryAdjustmentRequest;
import ptithcm.tttnd35backend.dto.response.InventoryAdjustmentResponse;
import ptithcm.tttnd35backend.dto.response.LowStockVariantResponse;
import ptithcm.tttnd35backend.dto.response.pagination.PageResponse;
import ptithcm.tttnd35backend.dto.response.pagination.PaginationMeta;
import ptithcm.tttnd35backend.entity.InventoryAdjustment;
import ptithcm.tttnd35backend.entity.Product;
import ptithcm.tttnd35backend.entity.ProductVariant;
import ptithcm.tttnd35backend.entity.Profile;
import ptithcm.tttnd35backend.exception.BadRequestException;
import ptithcm.tttnd35backend.exception.ResourceNotFoundException;
import ptithcm.tttnd35backend.mapper.IInventoryMapper;
import ptithcm.tttnd35backend.repository.IInventoryAdjustmentRepository;
import ptithcm.tttnd35backend.repository.IProductRepository;
import ptithcm.tttnd35backend.repository.IProductVariantRepository;
import ptithcm.tttnd35backend.repository.IProfileRepository;
import ptithcm.tttnd35backend.service.IInventoryService;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class InventoryServiceImpl implements IInventoryService {

    private final IProductVariantRepository variantRepository;
    private final IProductRepository productRepository;
    private final IInventoryAdjustmentRepository adjustmentRepository;
    private final IProfileRepository profileRepository;
    private final IInventoryMapper inventoryMapper;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<LowStockVariantResponse> getInventory(UUID productId, Boolean lowStock, Pageable pageable) {
        Page<ProductVariant> page;
        if (productId != null) {
            page = variantRepository.findAllByProductId(productId, pageable);
        } else {
            page = variantRepository.findAll(pageable);
        }

        List<UUID> productIds = page.getContent().stream().map(ProductVariant::getProductId).toList();
        Map<UUID, Product> productMap = productRepository.findAllById(productIds).stream()
                .collect(Collectors.toMap(Product::getId, p -> p));

        List<LowStockVariantResponse> list = page.getContent().stream().map(v -> {
            Product p = productMap.get(v.getProductId());
            return LowStockVariantResponse.builder()
                    .variantId(v.getId())
                    .variantName(v.getVariantName())
                    .sku(v.getSku())
                    .productId(v.getProductId())
                    .productName(p != null ? p.getName() : null)
                    .stockQuantity(v.getStock())
                    .price(v.getPrice())
                    .build();
        }).toList();

        return PageResponse.<LowStockVariantResponse>builder()
                .items(list)
                .pagination(PaginationMeta.builder()
                        .currentPage(page.getNumber())
                        .pageSize(page.getSize())
                        .totalPages(page.getTotalPages())
                        .totalItems(page.getTotalElements())
                        .build())
                .build();
    }

    @Override
    public InventoryAdjustmentResponse adjustStock(UUID variantId, InventoryAdjustmentRequest request, UUID currentUserId) {
        ProductVariant variant = variantRepository.findById(variantId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy biến thể sản phẩm với id: " + variantId));

        int newStock = variant.getStock() + request.delta();
        if (newStock < 0) {
            throw new BadRequestException("Tồn kho sau khi điều chỉnh không thể âm (Tồn hiện tại: " + variant.getStock() + ", delta: " + request.delta() + ")");
        }

        variant.setStock(newStock);
        variantRepository.save(variant);

        Profile actor = currentUserId != null ? profileRepository.findById(currentUserId).orElse(null) : null;

        InventoryAdjustment adjustment = InventoryAdjustment.builder()
                .variant(variant)
                .delta(request.delta())
                .reason(request.reason())
                .note(request.note())
                .adjustedBy(actor)
                .build();

        InventoryAdjustment saved = adjustmentRepository.save(adjustment);
        log.info("Adjusted stock for variantId={}, delta={}, newStock={}, reason={}", variantId, request.delta(), newStock, request.reason());
        return inventoryMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<InventoryAdjustmentResponse> getAdjustmentHistory(UUID variantId) {
        if (!variantRepository.existsById(variantId)) {
            throw new ResourceNotFoundException("Không tìm thấy biến thể sản phẩm với id: " + variantId);
        }
        return inventoryMapper.toResponseList(adjustmentRepository.findByVariantIdOrderByCreatedAtDesc(variantId));
    }
}
