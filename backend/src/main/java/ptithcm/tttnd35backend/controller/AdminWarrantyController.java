package ptithcm.tttnd35backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import ptithcm.tttnd35backend.config.security.UserPrincipal;
import ptithcm.tttnd35backend.dto.request.WarrantyCardRequest;
import ptithcm.tttnd35backend.dto.request.WarrantyHistoryRequest;
import ptithcm.tttnd35backend.dto.response.ApiResponse;
import ptithcm.tttnd35backend.dto.response.WarrantyCardResponse;
import ptithcm.tttnd35backend.dto.response.WarrantyHistoryResponse;
import ptithcm.tttnd35backend.dto.response.pagination.PageResponse;
import ptithcm.tttnd35backend.service.IWarrantyService;
import ptithcm.tttnd35backend.util.enums.WarrantyStatus;

import java.time.LocalDateTime;
import java.util.UUID;

@RestController
@RequestMapping("/admin/warranty")
@RequiredArgsConstructor
public class AdminWarrantyController {

    private final IWarrantyService warrantyService;

    @GetMapping
    @PreAuthorize("hasAuthority('WARRANTY_MANAGE')")
    public ApiResponse<PageResponse<WarrantyCardResponse>> getAdminWarrantyCards(
            @RequestParam(required = false) WarrantyStatus status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        var pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ApiResponse.<PageResponse<WarrantyCardResponse>>builder()
                .success(true)
                .data(warrantyService.getAdminWarrantyCards(status, search, pageable))
                .timestamp(LocalDateTime.now())
                .build();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('WARRANTY_MANAGE')")
    public ApiResponse<WarrantyCardResponse> getById(@PathVariable UUID id) {
        return ApiResponse.<WarrantyCardResponse>builder()
                .success(true)
                .data(warrantyService.getWarrantyCardById(id))
                .timestamp(LocalDateTime.now())
                .build();
    }

    @PostMapping
    @PreAuthorize("hasAuthority('WARRANTY_MANAGE')")
    public ApiResponse<WarrantyCardResponse> create(Authentication authentication, @RequestBody @Valid WarrantyCardRequest request) {
        UUID currentUserId = currentProfileId(authentication);
        return ApiResponse.<WarrantyCardResponse>builder()
                .success(true)
                .message("Lập phiếu bảo hành thành công")
                .data(warrantyService.createWarrantyCard(request, currentUserId))
                .timestamp(LocalDateTime.now())
                .build();
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAuthority('WARRANTY_MANAGE')")
    public ApiResponse<WarrantyCardResponse> updateStatus(
            @PathVariable UUID id,
            @RequestParam WarrantyStatus status,
            @RequestParam(required = false) String notes
    ) {
        return ApiResponse.<WarrantyCardResponse>builder()
                .success(true)
                .message("Cập nhật trạng thái phiếu bảo hành thành công")
                .data(warrantyService.updateWarrantyStatus(id, status, notes))
                .timestamp(LocalDateTime.now())
                .build();
    }

    @PostMapping("/{id}/histories")
    @PreAuthorize("hasAuthority('WARRANTY_MANAGE')")
    public ApiResponse<WarrantyHistoryResponse> addHistory(
            Authentication authentication,
            @PathVariable UUID id,
            @RequestBody @Valid WarrantyHistoryRequest request
    ) {
        UUID currentUserId = currentProfileId(authentication);
        return ApiResponse.<WarrantyHistoryResponse>builder()
                .success(true)
                .message("Ghi nhận yêu cầu sửa chữa bảo hành thành công")
                .data(warrantyService.addWarrantyHistory(id, request, currentUserId))
                .timestamp(LocalDateTime.now())
                .build();
    }

    @PatchMapping("/{cardId}/histories/{historyId}")
    @PreAuthorize("hasAuthority('WARRANTY_MANAGE')")
    public ApiResponse<WarrantyHistoryResponse> updateHistory(
            Authentication authentication,
            @PathVariable UUID cardId,
            @PathVariable UUID historyId,
            @RequestBody WarrantyHistoryRequest request
    ) {
        UUID currentUserId = currentProfileId(authentication);
        return ApiResponse.<WarrantyHistoryResponse>builder()
                .success(true)
                .message("Cập nhật tiến độ xử lý bảo hành thành công")
                .data(warrantyService.updateWarrantyHistory(cardId, historyId, request, currentUserId))
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
 * 1. POST /admin/warranty
 * curl -X POST "http://localhost:8080/admin/warranty" -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" -d '{"customerName":"Nguyễn Văn A","customerPhone":"0912345678","productName":"Laptop Asus ROG","purchaseDate":"2026-08-01","warrantyMonths":24}'
 */
