package ptithcm.tttnd35backend.service;

import org.springframework.data.domain.Pageable;
import ptithcm.tttnd35backend.dto.request.WarrantyCardRequest;
import ptithcm.tttnd35backend.dto.request.WarrantyHistoryRequest;
import ptithcm.tttnd35backend.dto.response.WarrantyCardResponse;
import ptithcm.tttnd35backend.dto.response.WarrantyHistoryResponse;
import ptithcm.tttnd35backend.dto.response.pagination.PageResponse;
import ptithcm.tttnd35backend.entity.Order;
import ptithcm.tttnd35backend.util.enums.WarrantyStatus;

import java.util.UUID;

public interface IWarrantyService {

    // Public Lookup
    WarrantyCardResponse lookupWarranty(String phone, String serial);

    // Admin
    PageResponse<WarrantyCardResponse> getAdminWarrantyCards(WarrantyStatus status, String search, Pageable pageable);

    WarrantyCardResponse getWarrantyCardById(UUID id);

    WarrantyCardResponse createWarrantyCard(WarrantyCardRequest request, UUID currentUserId);

    WarrantyCardResponse updateWarrantyStatus(UUID id, WarrantyStatus status, String notes);

    WarrantyHistoryResponse addWarrantyHistory(UUID cardId, WarrantyHistoryRequest request, UUID currentUserId);

    WarrantyHistoryResponse updateWarrantyHistory(UUID cardId, UUID historyId, WarrantyHistoryRequest request, UUID currentUserId);

    // Auto-generator trigger from Order Completion
    void generateWarrantyCardsFromOrder(Order order);
}
