package ptithcm.tttnd35backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import ptithcm.tttnd35backend.dto.request.CampaignItemRequest;
import ptithcm.tttnd35backend.dto.request.CampaignRequest;
import ptithcm.tttnd35backend.dto.request.StatusRequest;
import ptithcm.tttnd35backend.dto.response.ApiResponse;
import ptithcm.tttnd35backend.dto.response.CampaignItemResponse;
import ptithcm.tttnd35backend.dto.response.CampaignResponse;
import ptithcm.tttnd35backend.service.ICampaignService;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/admin/campaigns")
@RequiredArgsConstructor
public class AdminCampaignController {

    private final ICampaignService campaignService;

    @GetMapping
    @PreAuthorize("hasAuthority('CAMPAIGN_UPDATE')")
    public ApiResponse<List<CampaignResponse>> getAll() {
        return ApiResponse.<List<CampaignResponse>>builder()
                .success(true)
                .data(campaignService.getAll())
                .timestamp(LocalDateTime.now())
                .build();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('CAMPAIGN_UPDATE')")
    public ApiResponse<CampaignResponse> getById(@PathVariable UUID id) {
        return ApiResponse.<CampaignResponse>builder()
                .success(true)
                .data(campaignService.getById(id))
                .timestamp(LocalDateTime.now())
                .build();
    }

    @PostMapping
    @PreAuthorize("hasAuthority('CAMPAIGN_CREATE')")
    public ApiResponse<CampaignResponse> create(@RequestBody @Valid CampaignRequest request) {
        return ApiResponse.<CampaignResponse>builder()
                .success(true)
                .message("Tạo đợt khuyến mãi thành công")
                .data(campaignService.create(request))
                .timestamp(LocalDateTime.now())
                .build();
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('CAMPAIGN_UPDATE')")
    public ApiResponse<CampaignResponse> update(@PathVariable UUID id, @RequestBody @Valid CampaignRequest request) {
        return ApiResponse.<CampaignResponse>builder()
                .success(true)
                .message("Cập nhật đợt khuyến mãi thành công")
                .data(campaignService.update(id, request))
                .timestamp(LocalDateTime.now())
                .build();
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAuthority('CAMPAIGN_DELETE')")
    public ApiResponse<CampaignResponse> setStatus(@PathVariable UUID id, @RequestBody @Valid StatusRequest request) {
        CampaignResponse response = campaignService.setActive(id, request.getIsActive());
        return ApiResponse.<CampaignResponse>builder()
                .success(true)
                .message(request.getIsActive() ? "Đã khôi phục đợt khuyến mãi" : "Đã ẩn đợt khuyến mãi")
                .data(response)
                .timestamp(LocalDateTime.now())
                .build();
    }

    @GetMapping("/{id}/items")
    @PreAuthorize("hasAuthority('CAMPAIGN_UPDATE')")
    public ApiResponse<List<CampaignItemResponse>> getItems(@PathVariable UUID id) {
        return ApiResponse.<List<CampaignItemResponse>>builder()
                .success(true)
                .data(campaignService.getItems(id))
                .timestamp(LocalDateTime.now())
                .build();
    }

    @PostMapping("/{id}/items")
    @PreAuthorize("hasAuthority('CAMPAIGN_UPDATE')")
    public ApiResponse<CampaignItemResponse> addItem(@PathVariable UUID id, @RequestBody @Valid CampaignItemRequest request) {
        return ApiResponse.<CampaignItemResponse>builder()
                .success(true)
                .message("Thêm sản phẩm vào khuyến mãi thành công")
                .data(campaignService.addItem(id, request))
                .timestamp(LocalDateTime.now())
                .build();
    }

    @PutMapping("/{id}/items/{itemId}")
    @PreAuthorize("hasAuthority('CAMPAIGN_UPDATE')")
    public ApiResponse<CampaignItemResponse> updateItem(
            @PathVariable UUID id, @PathVariable UUID itemId, @RequestBody @Valid CampaignItemRequest request) {
        return ApiResponse.<CampaignItemResponse>builder()
                .success(true)
                .message("Cập nhật mục khuyến mãi thành công")
                .data(campaignService.updateItem(id, itemId, request))
                .timestamp(LocalDateTime.now())
                .build();
    }

    @DeleteMapping("/{id}/items/{itemId}")
    @PreAuthorize("hasAuthority('CAMPAIGN_UPDATE')")
    public ApiResponse<?> deleteItem(@PathVariable UUID id, @PathVariable UUID itemId) {
        campaignService.deleteItem(id, itemId);
        return ApiResponse.builder()
                .success(true)
                .message("Đã xóa sản phẩm khỏi khuyến mãi")
                .timestamp(LocalDateTime.now())
                .build();
    }
}
