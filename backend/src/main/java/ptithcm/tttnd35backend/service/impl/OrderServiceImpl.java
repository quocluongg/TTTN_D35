package ptithcm.tttnd35backend.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ptithcm.tttnd35backend.dto.request.GuestOrderCreateRequest;
import ptithcm.tttnd35backend.dto.request.OrderCreateRequest;
import ptithcm.tttnd35backend.dto.request.OrderItemRequest;
import ptithcm.tttnd35backend.dto.request.OrderStatusUpdateRequest;
import ptithcm.tttnd35backend.dto.response.OrderItemResponse;
import ptithcm.tttnd35backend.dto.response.OrderResponse;
import ptithcm.tttnd35backend.dto.response.pagination.PageResponse;
import ptithcm.tttnd35backend.entity.*;
import ptithcm.tttnd35backend.exception.BadRequestException;
import ptithcm.tttnd35backend.exception.ResourceNotFoundException;
import ptithcm.tttnd35backend.repository.*;
import ptithcm.tttnd35backend.service.ICampaignService;
import ptithcm.tttnd35backend.service.IOrderService;
import ptithcm.tttnd35backend.service.IVoucherService;
import ptithcm.tttnd35backend.service.VoucherResolution;
import ptithcm.tttnd35backend.util.enums.OrderStatus;
import ptithcm.tttnd35backend.util.enums.PaymentMethod;
import ptithcm.tttnd35backend.util.enums.PaymentStatus;
import ptithcm.tttnd35backend.util.helper.PageResponseHelper;
import ptithcm.tttnd35backend.util.helper.PriceCalculator;

import ptithcm.tttnd35backend.service.IWarrantyService;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements IOrderService {

    private final IOrderRepository orderRepository;
    private final IOrderItemRepository orderItemRepository;
    private final ICartItemRepository cartItemRepository;
    private final IAddressRepository addressRepository;
    private final IProductRepository productRepository;
    private final IProductVariantRepository productVariantRepository;
    private final ICampaignItemRepository campaignItemRepository;
    private final ICampaignService campaignService;
    private final IVoucherService voucherService;
    private final IVoucherUsageRepository voucherUsageRepository;
    private final IVoucherRepository voucherRepository;
    private final IPaymentTransactionRepository paymentTransactionRepository;
    private final IWarrantyService warrantyService;

    @Override
    @Transactional
    public OrderResponse checkout(UUID profileId, OrderCreateRequest request) {
        Address address = addressRepository.findByIdAndProfileId(request.getAddressId(), profileId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy địa chỉ giao hàng"));

        List<CartItem> cartItems = cartItemRepository.findAllByProfileIdOrderByCreatedAtDesc(profileId);
        if (request.getVariantIds() != null && !request.getVariantIds().isEmpty()) {
            Set<UUID> selected = new HashSet<>(request.getVariantIds());
            cartItems = cartItems.stream().filter(ci -> selected.contains(ci.getVariant().getId())).toList();
        }
        if (cartItems.isEmpty()) {
            throw new BadRequestException("Giỏ hàng trống hoặc không có sản phẩm nào được chọn");
        }

        List<OrderItemRequest> lines = cartItems.stream()
                .map(ci -> OrderItemRequest.builder().variantId(ci.getVariant().getId()).quantity(ci.getQuantity()).build())
                .toList();

        String shippingAddress = String.join(", ", address.getDetailAddress(), address.getWard(),
                address.getDistrict(), address.getProvince());

        Profile user = Profile.builder().id(profileId).build();
        Order order = buildAndPersistOrder(lines, user, address, address.getRecipientName(), null,
                address.getPhone(), shippingAddress, request.getVoucherCode(), request.getPaymentMethod());

        // Checkout xong thì xoá đúng các dòng cart đã đặt (không đụng tới dòng chưa chọn nếu checkout 1 phần).
        Set<UUID> orderedVariantIds = lines.stream().map(OrderItemRequest::getVariantId).collect(Collectors.toSet());
        cartItems.stream()
                .filter(ci -> orderedVariantIds.contains(ci.getVariant().getId()))
                .forEach(cartItemRepository::delete);

        return toResponse(order, orderItemRepository.findAllByOrderId(order.getId()));
    }

    @Override
    @Transactional
    public OrderResponse checkoutGuest(GuestOrderCreateRequest request) {
        Order order = buildAndPersistOrder(request.getItems(), null, null, request.getCustomerName(),
                request.getCustomerEmail(), request.getCustomerPhone(), request.getShippingAddress(),
                request.getVoucherCode(), request.getPaymentMethod());

        return toResponse(order, orderItemRepository.findAllByOrderId(order.getId()));
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse getMyOrderDetail(UUID profileId, UUID orderId) {
        Order order = orderRepository.findByIdAndUserId(orderId, profileId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng"));
        return toResponse(order, orderItemRepository.findAllByOrderId(orderId));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<OrderResponse> getMyOrders(UUID profileId, int page, int size) {
        Page<Order> orders = orderRepository.findAllByUserIdOrderByCreatedAtDesc(profileId, PageRequest.of(page, size));
        return toPageResponse(orders);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse getDetailForAdmin(UUID orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng"));
        return toResponse(order, orderItemRepository.findAllByOrderId(orderId));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<OrderResponse> getAllForAdmin(OrderStatus status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Order> orders = status != null
                ? orderRepository.findAllByStatusOrderByCreatedAtDesc(status, pageable)
                : orderRepository.findAll(pageable);
        return toPageResponse(orders);
    }

    @Override
    @Transactional
    public OrderResponse cancelByCustomer(UUID profileId, UUID orderId) {
        Order order = orderRepository.findByIdAndUserId(orderId, profileId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng"));
        if (order.getStatus() != OrderStatus.PENDING) {
            throw new BadRequestException("Đơn hàng đang được xử lý, không thể tự huỷ. Vui lòng liên hệ hỗ trợ");
        }
        cancelAndRollback(order);
        return toResponse(order, orderItemRepository.findAllByOrderId(orderId));
    }

    @Override
    @Transactional
    public OrderResponse updateStatus(UUID orderId, OrderStatusUpdateRequest request) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng"));

        if (order.getStatus() == OrderStatus.CANCELLED || order.getStatus() == OrderStatus.COMPLETED) {
            throw new BadRequestException("Đơn hàng đã ở trạng thái cuối, không thể đổi thêm");
        }

        if (request.getStatus() == OrderStatus.CANCELLED) {
            cancelAndRollback(order);
        } else {
            order.setStatus(request.getStatus());
            if (request.getTrackingNumber() != null) {
                order.setTrackingNumber(request.getTrackingNumber());
            }
            // COD thu tiền khi giao thành công - đơn COMPLETED coi như đã thanh toán.
            if (request.getStatus() == OrderStatus.COMPLETED && order.getPaymentMethod() == PaymentMethod.COD) {
                order.setPaymentStatus(PaymentStatus.PAID);
            }
            orderRepository.save(order);
            if (request.getStatus() == OrderStatus.COMPLETED) {
                warrantyService.generateWarrantyCardsFromOrder(order);
            }
        }
        return toResponse(order, orderItemRepository.findAllByOrderId(orderId));
    }

    // ===== Core: tạo đơn (dùng chung cho cả checkout từ Cart lẫn Guest) =====

    private Order buildAndPersistOrder(List<OrderItemRequest> lines, Profile user, Address address,
                                        String customerName, String customerEmail, String customerPhone,
                                        String shippingAddress, String voucherCode, PaymentMethod paymentMethod) {

        Set<UUID> variantIds = lines.stream().map(OrderItemRequest::getVariantId).collect(Collectors.toSet());
        Map<UUID, ProductVariant> variantById = productVariantRepository.findAllById(variantIds).stream()
                .collect(Collectors.toMap(ProductVariant::getId, v -> v));
        if (variantById.size() != variantIds.size()) {
            throw new ResourceNotFoundException("Một số sản phẩm trong đơn không còn tồn tại");
        }

        Map<UUID, Product> productById = productRepository.findAllById(
                        variantById.values().stream().map(ProductVariant::getProductId).collect(Collectors.toSet()))
                .stream().collect(Collectors.toMap(Product::getId, p -> p));

        Map<UUID, CampaignItem> saleItemByVariant = campaignService.getActiveSaleItems(variantIds);

        // Gộp số lượng nếu request lỡ trùng variant (vd guest nhập tay 2 dòng cùng 1 sản phẩm).
        Map<UUID, Integer> quantityByVariant = new LinkedHashMap<>();
        for (OrderItemRequest line : lines) {
            quantityByVariant.merge(line.getVariantId(), line.getQuantity(), Integer::sum);
        }

        BigDecimal totalAmount = BigDecimal.ZERO;
        BigDecimal eligibleForVoucher = BigDecimal.ZERO; // không tính hàng đang sale
        List<OrderItem> itemsToCreate = new ArrayList<>();

        for (Map.Entry<UUID, Integer> entry : quantityByVariant.entrySet()) {
            ProductVariant variant = variantById.get(entry.getKey());
            Product product = productById.get(variant.getProductId());
            int quantity = entry.getValue();

            if (product == null || !product.isActive()) {
                throw new BadRequestException("Sản phẩm '" + variant.getVariantName() + "' hiện không khả dụng");
            }

            CampaignItem saleItem = saleItemByVariant.get(variant.getId());
            BigDecimal unitPrice = saleItem != null
                    ? PriceCalculator.applyDiscount(variant.getPrice(), saleItem.getDiscountType(), saleItem.getDiscountValue())
                    : variant.getPrice();

            // ===== Trừ kho ATOMIC ngay ở DB - chống race condition, KHÔNG check "if (stock >= qty)" bằng code =====
            int updatedRows = productVariantRepository.decreaseStock(variant.getId(), quantity);
            if (updatedRows == 0) {
                // 0 dòng bị ảnh hưởng = không đủ hàng (vừa bị đơn khác giành mất) -> ném lỗi để
                // @Transactional rollback TOÀN BỘ (kể cả các variant đã trừ thành công trước đó trong vòng lặp).
                throw new BadRequestException("Sản phẩm '" + variant.getVariantName() + "' không đủ hàng trong kho");
            }

            if (saleItem != null && saleItem.getStockQuantity() != null) {
                int saleRows = campaignItemRepository.decreaseStock(saleItem.getId(), quantity);
                if (saleRows == 0) {
                    throw new BadRequestException("Suất sale cho '" + variant.getVariantName() + "' vừa hết, vui lòng đặt lại");
                }
            }

            BigDecimal lineTotal = unitPrice.multiply(BigDecimal.valueOf(quantity));
            totalAmount = totalAmount.add(lineTotal);
            if (saleItem == null) {
                eligibleForVoucher = eligibleForVoucher.add(lineTotal);
            }

            itemsToCreate.add(OrderItem.builder()
                    .productId(product.getId())
                    .variantId(variant.getId())
                    .quantity(quantity)
                    .priceAtPurchase(unitPrice)
                    .attributesSnapshot(variant.getAttributes())
                    .build());
        }

        // ===== Áp voucher (nếu có) - atomic tăng used_count, chống 2 đơn giành lượt cuối =====
        BigDecimal discountAmount = BigDecimal.ZERO;
        Voucher appliedVoucher = null;
        if (voucherCode != null && !voucherCode.isBlank()) {
            VoucherResolution resolution = voucherService.resolveForOrder(
                    voucherCode, user != null ? user.getId() : null, eligibleForVoucher);
            appliedVoucher = resolution.getVoucher();
            discountAmount = resolution.getDiscountAmount();

            int voucherRows = voucherRepository.incrementUsedCount(appliedVoucher.getId());
            if (voucherRows == 0) {
                throw new BadRequestException("Voucher vừa hết lượt sử dụng, vui lòng bỏ mã và thử lại");
            }
        }
        totalAmount = totalAmount.subtract(discountAmount).max(BigDecimal.ZERO);

        Order order = Order.builder()
                .user(user)
                .address(address)
                .voucherId(appliedVoucher != null ? appliedVoucher.getId() : null)
                .discountAmount(discountAmount)
                .customerName(customerName)
                .customerEmail(customerEmail)
                .customerPhone(customerPhone)
                .shippingAddress(shippingAddress)
                .totalAmount(totalAmount)
                .paymentMethod(paymentMethod)
                .build();
        order = orderRepository.save(order);

        for (OrderItem item : itemsToCreate) {
            item.setOrderId(order.getId());
        }
        orderItemRepository.saveAll(itemsToCreate);

        if (appliedVoucher != null) {
            voucherUsageRepository.save(VoucherUsage.builder()
                    .voucherId(appliedVoucher.getId())
                    .orderId(order.getId())
                    .profileId(user != null ? user.getId() : null)
                    .discountAmount(discountAmount)
                    .build());
        }

        // Giữ chỗ thanh toán - PaymentService sẽ tạo URL/clientSecret dựa vào dòng PENDING này.
        paymentTransactionRepository.save(PaymentTransaction.builder()
                .orderId(order.getId())
                .provider(paymentMethod)
                .amount(totalAmount)
                .build());

        return order;
    }

    // Huỷ đơn + hoàn kho variant + hoàn suất sale (nếu có) + hoàn lượt voucher - dùng chung cho
    // khách tự huỷ, admin huỷ, và job tự động huỷ đơn quá hạn thanh toán.
    private void cancelAndRollback(Order order) {
        List<OrderItem> items = orderItemRepository.findAllByOrderId(order.getId());
        Set<UUID> variantIds = items.stream().map(OrderItem::getVariantId).collect(Collectors.toSet());
        // Lưu ý: chỉ khớp lại được CampaignItem nếu campaign đó vẫn đang active lúc huỷ đơn.
        // Nếu campaign đã kết thúc/bị ẩn thì bỏ qua hoàn suất sale (không ảnh hưởng phần quan trọng
        // nhất là hoàn tồn kho variant, luôn chạy trước và độc lập).
        Map<UUID, CampaignItem> saleItemByVariant = campaignService.getActiveSaleItems(variantIds);

        for (OrderItem item : items) {
            productVariantRepository.increaseStock(item.getVariantId(), item.getQuantity());
            CampaignItem saleItem = saleItemByVariant.get(item.getVariantId());
            if (saleItem != null && saleItem.getStockQuantity() != null) {
                campaignItemRepository.increaseStock(saleItem.getId(), item.getQuantity());
            }
        }

        if (order.getVoucherId() != null) {
            voucherRepository.decrementUsedCount(order.getVoucherId());
            voucherUsageRepository.deleteByOrderId(order.getId());
        }

        order.setStatus(OrderStatus.CANCELLED);
        if (order.getPaymentStatus() == PaymentStatus.PENDING) {
            order.setPaymentStatus(PaymentStatus.FAILED);
        }
        orderRepository.save(order);
    }

    // ===== Mapping =====

    private PageResponse<OrderResponse> toPageResponse(Page<Order> orders) {
        List<UUID> orderIds = orders.getContent().stream().map(Order::getId).toList();
        Map<UUID, List<OrderItem>> itemsByOrder = orderIds.isEmpty() ? Map.of()
                : orderItemRepository.findAllByOrderIdIn(orderIds).stream()
                        .collect(Collectors.groupingBy(OrderItem::getOrderId));

        return PageResponseHelper.toPageResponse(
                orders.map(o -> toResponse(o, itemsByOrder.getOrDefault(o.getId(), List.of()))));
    }

    private OrderResponse toResponse(Order order, List<OrderItem> items) {
        Set<UUID> productIds = items.stream().map(OrderItem::getProductId).collect(Collectors.toSet());
        Set<UUID> variantIds = items.stream().map(OrderItem::getVariantId).collect(Collectors.toSet());
        Map<UUID, Product> productById = productIds.isEmpty() ? Map.of()
                : productRepository.findAllById(productIds).stream().collect(Collectors.toMap(Product::getId, p -> p));
        Map<UUID, ProductVariant> variantById = variantIds.isEmpty() ? Map.of()
                : productVariantRepository.findAllById(variantIds).stream().collect(Collectors.toMap(ProductVariant::getId, v -> v));

        List<OrderItemResponse> itemResponses = items.stream().map(item -> {
            Product product = productById.get(item.getProductId());
            ProductVariant variant = variantById.get(item.getVariantId());
            return OrderItemResponse.builder()
                    .id(item.getId())
                    .productId(item.getProductId())
                    .productName(product != null ? product.getName() : null)
                    .variantId(item.getVariantId())
                    .variantName(variant != null ? variant.getVariantName() : null)
                    .attributes(item.getAttributesSnapshot())
                    .image(variant != null && variant.getImage() != null ? variant.getImage()
                            : (product != null ? product.getThumbnail() : null))
                    .quantity(item.getQuantity())
                    .priceAtPurchase(item.getPriceAtPurchase())
                    .lineTotal(item.getPriceAtPurchase().multiply(BigDecimal.valueOf(item.getQuantity())))
                    .build();
        }).toList();

        String voucherCode = order.getVoucherId() != null
                ? voucherRepository.findById(order.getVoucherId()).map(Voucher::getCode).orElse(null)
                : null;

        return OrderResponse.builder()
                .id(order.getId())
                .customerName(order.getCustomerName())
                .customerEmail(order.getCustomerEmail())
                .customerPhone(order.getCustomerPhone())
                .shippingAddress(order.getShippingAddress())
                .voucherCode(voucherCode)
                .discountAmount(order.getDiscountAmount())
                .totalAmount(order.getTotalAmount())
                .status(order.getStatus())
                .paymentMethod(order.getPaymentMethod())
                .paymentStatus(order.getPaymentStatus())
                .trackingNumber(order.getTrackingNumber())
                .items(itemResponses)
                .createdAt(order.getCreatedAt())
                .build();
    }
}
