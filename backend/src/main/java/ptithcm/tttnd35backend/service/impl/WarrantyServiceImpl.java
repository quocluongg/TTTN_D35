package ptithcm.tttnd35backend.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import ptithcm.tttnd35backend.dto.request.WarrantyCardRequest;
import ptithcm.tttnd35backend.dto.request.WarrantyHistoryRequest;
import ptithcm.tttnd35backend.dto.response.WarrantyCardResponse;
import ptithcm.tttnd35backend.dto.response.WarrantyHistoryResponse;
import ptithcm.tttnd35backend.dto.response.pagination.PageResponse;
import ptithcm.tttnd35backend.dto.response.pagination.PaginationMeta;
import ptithcm.tttnd35backend.entity.*;
import ptithcm.tttnd35backend.exception.ResourceNotFoundException;
import ptithcm.tttnd35backend.mapper.IWarrantyMapper;
import ptithcm.tttnd35backend.repository.*;
import ptithcm.tttnd35backend.repository.spec.WarrantySpecifications;
import ptithcm.tttnd35backend.service.IWarrantyService;
import ptithcm.tttnd35backend.util.enums.WarrantyRepairStatus;
import ptithcm.tttnd35backend.util.enums.WarrantyStatus;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class WarrantyServiceImpl implements IWarrantyService {

    private final IWarrantyCardRepository warrantyCardRepository;
    private final IWarrantyHistoryRepository warrantyHistoryRepository;
    private final IOrderRepository orderRepository;
    private final IOrderItemRepository orderItemRepository;
    private final IProductRepository productRepository;
    private final IProfileRepository profileRepository;
    private final IWarrantyMapper warrantyMapper;

    private static final String ALPHA_NUMERIC = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private final SecureRandom random = new SecureRandom();

    @Override
    @Transactional(readOnly = true)
    public WarrantyCardResponse lookupWarranty(String phone, String serial) {
        WarrantyCard card = warrantyCardRepository.findByCustomerPhoneAndSerialNumber(phone, serial)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy phiếu bảo hành khớp với thông tin cung cấp"));

        var response = warrantyMapper.toResponse(card);
        var histories = warrantyHistoryRepository.findByWarrantyCardIdOrderByRequestDateDesc(card.getId());
        response.setHistories(warrantyMapper.toHistoryResponseList(histories));
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<WarrantyCardResponse> getAdminWarrantyCards(WarrantyStatus status, String search,
            Pageable pageable) {
        var spec = WarrantySpecifications.withFilter(status, search);
        var page = warrantyCardRepository.findAll(spec, pageable);

        var list = page.getContent().stream().map(card -> {
            var res = warrantyMapper.toResponse(card);
            var histories = warrantyHistoryRepository.findByWarrantyCardIdOrderByRequestDateDesc(card.getId());
            res.setHistories(warrantyMapper.toHistoryResponseList(histories));
            return res;
        }).toList();

        return PageResponse.<WarrantyCardResponse>builder()
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
    @Transactional(readOnly = true)
    public WarrantyCardResponse getWarrantyCardById(UUID id) {
        WarrantyCard card = warrantyCardRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phiếu bảo hành với id: " + id));

        var response = warrantyMapper.toResponse(card);
        var histories = warrantyHistoryRepository.findByWarrantyCardIdOrderByRequestDateDesc(card.getId());
        response.setHistories(warrantyMapper.toHistoryResponseList(histories));
        return response;
    }

    @Override
    public WarrantyCardResponse createWarrantyCard(WarrantyCardRequest request, UUID currentUserId) {
        WarrantyCard card = warrantyMapper.toEntity(request);

        if (request.orderId() != null) {
            Order order = orderRepository.findById(request.orderId()).orElse(null);
            card.setOrder(order);
        }
        if (request.orderItemId() != null) {
            OrderItem orderItem = orderItemRepository.findById(request.orderItemId()).orElse(null);
            card.setOrderItem(orderItem);
        }

        String serial = StringUtils.hasText(request.serialNumber()) ? request.serialNumber() : generateUniqueSerial();
        card.setSerialNumber(serial);

        LocalDate purchaseDate = request.purchaseDate() != null ? request.purchaseDate() : LocalDate.now();
        int months = request.warrantyMonths() != null ? request.warrantyMonths() : 12;
        card.setPurchaseDate(purchaseDate);
        card.setWarrantyMonths(months);
        card.setExpiryDate(purchaseDate.plusMonths(months));
        card.setStatus(WarrantyStatus.ACTIVE);

        if (currentUserId != null) {
            Profile creator = profileRepository.findById(currentUserId).orElse(null);
            card.setCreatedBy(creator);
        }

        WarrantyCard saved = warrantyCardRepository.save(card);
        var response = warrantyMapper.toResponse(saved);
        response.setHistories(List.of());
        return response;
    }

    @Override
    public WarrantyCardResponse updateWarrantyStatus(UUID id, WarrantyStatus status, String notes) {
        WarrantyCard card = warrantyCardRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phiếu bảo hành với id: " + id));

        if (status != null)
            card.setStatus(status);
        if (notes != null)
            card.setNotes(notes);

        WarrantyCard saved = warrantyCardRepository.save(card);
        var response = warrantyMapper.toResponse(saved);
        var histories = warrantyHistoryRepository.findByWarrantyCardIdOrderByRequestDateDesc(card.getId());
        response.setHistories(warrantyMapper.toHistoryResponseList(histories));
        return response;
    }

    @Override
    public WarrantyHistoryResponse addWarrantyHistory(UUID cardId, WarrantyHistoryRequest request, UUID currentUserId) {
        WarrantyCard card = warrantyCardRepository.findById(cardId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phiếu bảo hành với id: " + cardId));

        Profile handler = currentUserId != null ? profileRepository.findById(currentUserId).orElse(null) : null;

        WarrantyHistory history = WarrantyHistory.builder()
                .warrantyCard(card)
                .requestDate(LocalDateTime.now())
                .issueDescription(request.issueDescription())
                .repairAction(request.repairAction())
                .status(request.status() != null ? request.status() : WarrantyRepairStatus.PENDING)
                .handledBy(handler)
                .build();

        return warrantyMapper.toHistoryResponse(warrantyHistoryRepository.save(history));
    }

    @Override
    public WarrantyHistoryResponse updateWarrantyHistory(UUID cardId, UUID historyId, WarrantyHistoryRequest request,
            UUID currentUserId) {
        WarrantyHistory history = warrantyHistoryRepository.findById(historyId)
                .orElseThrow(
                        () -> new ResourceNotFoundException("Không tìm thấy lịch sử bảo hành với id: " + historyId));

        if (!history.getWarrantyCard().getId().equals(cardId)) {
            throw new ResourceNotFoundException("Lịch sử bảo hành không thuộc phiếu bảo hành này");
        }

        if (request.issueDescription() != null)
            history.setIssueDescription(request.issueDescription());
        if (request.repairAction() != null)
            history.setRepairAction(request.repairAction());

        if (request.status() != null) {
            if (request.status() == WarrantyRepairStatus.COMPLETED
                    && history.getStatus() != WarrantyRepairStatus.COMPLETED) {
                history.setCompletedAt(LocalDateTime.now());
            }
            history.setStatus(request.status());
        }

        if (currentUserId != null) {
            Profile handler = profileRepository.findById(currentUserId).orElse(null);
            history.setHandledBy(handler);
        }

        return warrantyMapper.toHistoryResponse(warrantyHistoryRepository.save(history));
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void generateWarrantyCardsFromOrder(Order order) {
        if (order == null || order.getId() == null)
            return;

        try {
            List<OrderItem> items = orderItemRepository.findAllByOrderId(order.getId());
            if (items.isEmpty())
                return;

            LocalDate purchaseDate = order.getCreatedAt() != null ? order.getCreatedAt().toLocalDate()
                    : LocalDate.now();

            List<UUID> productIds = items.stream().map(OrderItem::getProductId).toList();
            var productMap = productRepository.findAllById(productIds).stream()
                    .collect(java.util.stream.Collectors.toMap(Product::getId, p -> p));

            for (OrderItem item : items) {
                Product product = productMap.get(item.getProductId());
                if (product == null)
                    continue;

                Integer months = product.getWarrantyMonths();
                if (months == null || months <= 0)
                    continue;

                if (warrantyCardRepository.existsByOrderItemId(item.getId()))
                    continue;

                String serial = generateUniqueSerial();
                String pName = product.getName();

                WarrantyCard card = WarrantyCard.builder()
                        .order(order)
                        .orderItem(item)
                        .customerName(order.getCustomerName() != null ? order.getCustomerName() : "Khách hàng")
                        .customerPhone(order.getCustomerPhone() != null ? order.getCustomerPhone() : "N/A")
                        .customerEmail(order.getCustomerEmail())
                        .productName(pName)
                        .serialNumber(serial)
                        .purchaseDate(purchaseDate)
                        .warrantyMonths(months)
                        .expiryDate(purchaseDate.plusMonths(months))
                        .status(WarrantyStatus.ACTIVE)
                        .build();

                warrantyCardRepository.save(card);
                log.info("Auto-generated WarrantyCard serial={} for orderId={}", serial, order.getId());
            }
        } catch (Exception e) {
            log.error("Failed to auto-generate warranty card for orderId={}: {}", order.getId(), e.getMessage());
        }
    }

    private String generateUniqueSerial() {
        String serial;
        do {
            StringBuilder sb = new StringBuilder("WC-");
            for (int i = 0; i < 8; i++) {
                sb.append(ALPHA_NUMERIC.charAt(random.nextInt(ALPHA_NUMERIC.length())));
            }
            serial = sb.toString();
        } while (warrantyCardRepository.existsBySerialNumber(serial));
        return serial;
    }
}
