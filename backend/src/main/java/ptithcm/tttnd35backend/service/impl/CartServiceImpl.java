package ptithcm.tttnd35backend.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ptithcm.tttnd35backend.dto.request.CartItemQuantityRequest;
import ptithcm.tttnd35backend.dto.request.CartItemRequest;
import ptithcm.tttnd35backend.dto.response.CartItemResponse;
import ptithcm.tttnd35backend.dto.response.CartResponse;
import ptithcm.tttnd35backend.entity.CartItem;
import ptithcm.tttnd35backend.entity.Product;
import ptithcm.tttnd35backend.entity.ProductVariant;
import ptithcm.tttnd35backend.entity.Profile;
import ptithcm.tttnd35backend.exception.BadRequestException;
import ptithcm.tttnd35backend.exception.ResourceNotFoundException;
import ptithcm.tttnd35backend.repository.ICartItemRepository;
import ptithcm.tttnd35backend.repository.IProductRepository;
import ptithcm.tttnd35backend.repository.IProductVariantRepository;
import ptithcm.tttnd35backend.service.ICampaignService;
import ptithcm.tttnd35backend.service.ICartService;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CartServiceImpl implements ICartService {

    private final ICartItemRepository cartItemRepository;
    private final IProductVariantRepository productVariantRepository;
    private final IProductRepository productRepository;
    private final ICampaignService campaignService;

    @Override
    @Transactional(readOnly = true)
    public CartResponse getCart(UUID profileId) {
        return buildCartResponse(profileId);
    }

    @Override
    @Transactional
    public CartResponse addItem(UUID profileId, CartItemRequest request) {
        ProductVariant variant = loadSellableVariant(request.getVariantId());

        CartItem item = cartItemRepository.findByProfileIdAndVariantId(profileId, request.getVariantId())
                .orElse(null);

        int newQuantity = (item != null ? item.getQuantity() : 0) + request.getQuantity();
        validateStock(variant, newQuantity);

        if (item == null) {
            item = CartItem.builder()
                    .profile(Profile.builder().id(profileId).build())
                    .variant(variant)
                    .quantity(newQuantity)
                    .build();
        } else {
            item.setQuantity(newQuantity);
        }
        cartItemRepository.save(item);

        return buildCartResponse(profileId);
    }

    @Override
    @Transactional
    public CartResponse updateQuantity(UUID profileId, UUID cartItemId, CartItemQuantityRequest request) {
        CartItem item = cartItemRepository.findByIdAndProfileId(cartItemId, profileId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm trong giỏ hàng"));

        ProductVariant variant = loadSellableVariant(item.getVariant().getId());
        validateStock(variant, request.getQuantity());

        item.setQuantity(request.getQuantity());
        cartItemRepository.save(item);

        return buildCartResponse(profileId);
    }

    @Override
    @Transactional
    public CartResponse removeItem(UUID profileId, UUID cartItemId) {
        CartItem item = cartItemRepository.findByIdAndProfileId(cartItemId, profileId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm trong giỏ hàng"));

        cartItemRepository.delete(item);
        return buildCartResponse(profileId);
    }

    @Override
    @Transactional
    public void clearCart(UUID profileId) {
        cartItemRepository.deleteAllByProfileId(profileId);
    }

    // ===== Helper =====

    private ProductVariant loadSellableVariant(UUID variantId) {
        ProductVariant variant = productVariantRepository.findById(variantId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy biến thể sản phẩm"));

        Product product = productRepository.findById(variant.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm"));
        if (!product.isActive()) {
            throw new BadRequestException("Sản phẩm hiện không khả dụng");
        }
        return variant;
    }

    private void validateStock(ProductVariant variant, int requestedQuantity) {
        if (requestedQuantity > variant.getStock()) {
            throw new BadRequestException(
                    "Chỉ còn " + variant.getStock() + " sản phẩm trong kho cho biến thể này");
        }
    }

    // 1 query lấy cart item (kèm variant fetch-join) + 1 query IN lấy Product theo productId - không N+1
    // dù giỏ hàng có bao nhiêu dòng.
    private CartResponse buildCartResponse(UUID profileId) {
        List<CartItem> items = cartItemRepository.findAllByProfileIdOrderByCreatedAtDesc(profileId);

        Set<UUID> productIds = items.stream()
                .map(i -> i.getVariant().getProductId())
                .collect(Collectors.toSet());
        Map<UUID, Product> productById = productRepository.findAllById(productIds).stream()
                .collect(Collectors.toMap(Product::getId, p -> p));

        Set<UUID> variantIds = items.stream().map(i -> i.getVariant().getId()).collect(Collectors.toSet());
        Map<UUID, BigDecimal> salePrices = campaignService.getActiveSalePrices(variantIds);

        List<CartItemResponse> itemResponses = items.stream().map(item -> {
            ProductVariant variant = item.getVariant();
            Product product = productById.get(variant.getProductId());
            BigDecimal salePrice = salePrices.get(variant.getId());
            BigDecimal effectivePrice = salePrice != null ? salePrice : variant.getPrice();
            BigDecimal subtotal = effectivePrice.multiply(BigDecimal.valueOf(item.getQuantity()));

            return CartItemResponse.builder()
                    .id(item.getId())
                    .productId(product != null ? product.getId() : null)
                    .productName(product != null ? product.getName() : null)
                    .productSlug(product != null ? product.getSlug() : null)
                    .variantId(variant.getId())
                    .variantName(variant.getVariantName())
                    .attributes(variant.getAttributes())
                    .image(variant.getImage() != null ? variant.getImage() : (product != null ? product.getThumbnail() : null))
                    .price(variant.getPrice())
                    .salePrice(salePrice)
                    .vatPercent(variant.getVatPercent())
                    .quantity(item.getQuantity())
                    .subtotal(subtotal)
                    .availableStock(variant.getStock())
                    .build();
        }).toList();

        BigDecimal subtotal = itemResponses.stream()
                .map(CartItemResponse::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        int totalItems = itemResponses.stream().mapToInt(CartItemResponse::getQuantity).sum();

        return CartResponse.builder()
                .items(itemResponses)
                .totalItems(totalItems)
                .subtotal(subtotal)
                .build();
    }
}
