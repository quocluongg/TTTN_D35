package ptithcm.tttnd35backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import ptithcm.tttnd35backend.config.security.UserPrincipal;
import ptithcm.tttnd35backend.dto.request.InventoryAdjustmentRequest;
import ptithcm.tttnd35backend.dto.response.ApiResponse;
import ptithcm.tttnd35backend.dto.response.InventoryAdjustmentResponse;
import ptithcm.tttnd35backend.dto.response.LowStockVariantResponse;
import ptithcm.tttnd35backend.dto.response.pagination.PageResponse;
import ptithcm.tttnd35backend.service.IInventoryService;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/admin/inventory")
@RequiredArgsConstructor
public class AdminInventoryController {

    private final IInventoryService inventoryService;

    @GetMapping
    @PreAuthorize("hasAuthority('INVENTORY_VIEW') or hasAuthority('INVENTORY_MANAGE')")
    public ApiResponse<PageResponse<LowStockVariantResponse>> getInventory(
            @RequestParam(required = false) UUID productId,
            @RequestParam(required = false) Boolean lowStock,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size
    ) {
        var pageable = PageRequest.of(page, size, Sort.by("stock").ascending());
        return ApiResponse.<PageResponse<LowStockVariantResponse>>builder()
                .success(true)
                .data(inventoryService.getInventory(productId, lowStock, pageable))
                .timestamp(LocalDateTime.now())
                .build();
    }

    @PatchMapping("/variants/{id}/stock")
    @PreAuthorize("hasAuthority('INVENTORY_UPDATE')")
    public ApiResponse<InventoryAdjustmentResponse> adjustStock(
            Authentication authentication,
            @PathVariable UUID id,
            @RequestBody @Valid InventoryAdjustmentRequest request
    ) {
        UUID currentUserId = currentProfileId(authentication);
        return ApiResponse.<InventoryAdjustmentResponse>builder()
                .success(true)
                .message("Điều chỉnh tồn kho thành công")
                .data(inventoryService.adjustStock(id, request, currentUserId))
                .timestamp(LocalDateTime.now())
                .build();
    }

    @GetMapping("/variants/{id}/history")
    @PreAuthorize("hasAuthority('INVENTORY_VIEW')")
    public ApiResponse<List<InventoryAdjustmentResponse>> getAdjustmentHistory(@PathVariable UUID id) {
        return ApiResponse.<List<InventoryAdjustmentResponse>>builder()
                .success(true)
                .data(inventoryService.getAdjustmentHistory(id))
                .timestamp(LocalDateTime.now())
                .build();
    }

    private UUID currentProfileId(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof UserPrincipal principal)) {
            return null;
        }
        return principal.getProfile().getId();
    }
}
/*
 * Example cURL:
 * 1. PATCH /admin/inventory/variants/{id}/stock
 * curl -X PATCH "http://localhost:8080/admin/inventory/variants/<VARIANT_UUID>/stock" -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" -d '{"delta":10,"reason":"STOCK_IN","note":"Nhập kho đợt 1"}'
 */
