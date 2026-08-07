package ptithcm.tttnd35backend.service;

import org.springframework.data.domain.Pageable;
import ptithcm.tttnd35backend.dto.request.InventoryAdjustmentRequest;
import ptithcm.tttnd35backend.dto.response.InventoryAdjustmentResponse;
import ptithcm.tttnd35backend.dto.response.LowStockVariantResponse;
import ptithcm.tttnd35backend.dto.response.pagination.PageResponse;

import java.util.List;
import java.util.UUID;

public interface IInventoryService {

    PageResponse<LowStockVariantResponse> getInventory(UUID productId, Boolean lowStock, Pageable pageable);

    InventoryAdjustmentResponse adjustStock(UUID variantId, InventoryAdjustmentRequest request, UUID currentUserId);

    List<InventoryAdjustmentResponse> getAdjustmentHistory(UUID variantId);
}
