package ptithcm.tttnd35backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import ptithcm.tttnd35backend.config.security.UserPrincipal;
import ptithcm.tttnd35backend.dto.request.SystemConfigRequest;
import ptithcm.tttnd35backend.dto.response.ApiResponse;
import ptithcm.tttnd35backend.dto.response.SystemConfigResponse;
import ptithcm.tttnd35backend.service.ISystemConfigService;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/admin/system-configs")
@RequiredArgsConstructor
public class AdminSystemConfigController {

    private final ISystemConfigService configService;

    @GetMapping
    @PreAuthorize("hasAuthority('SYSTEM_CONFIG_VIEW') or hasAuthority('SYSTEM_CONFIG_MANAGE')")
    public ApiResponse<List<SystemConfigResponse>> getAllConfigs() {
        return ApiResponse.<List<SystemConfigResponse>>builder()
                .success(true)
                .data(configService.getAllConfigs())
                .timestamp(LocalDateTime.now())
                .build();
    }

    @GetMapping("/{key}")
    @PreAuthorize("hasAuthority('SYSTEM_CONFIG_VIEW') or hasAuthority('SYSTEM_CONFIG_MANAGE')")
    public ApiResponse<SystemConfigResponse> getConfigByKey(@PathVariable String key) {
        return ApiResponse.<SystemConfigResponse>builder()
                .success(true)
                .data(configService.getConfigByKey(key))
                .timestamp(LocalDateTime.now())
                .build();
    }

    @PutMapping("/{key}")
    @PreAuthorize("hasAuthority('SYSTEM_CONFIG_UPDATE')")
    public ApiResponse<SystemConfigResponse> updateConfig(
            Authentication authentication,
            @PathVariable String key,
            @RequestBody @Valid SystemConfigRequest request
    ) {
        UUID currentUserId = currentProfileId(authentication);
        return ApiResponse.<SystemConfigResponse>builder()
                .success(true)
                .message("Cập nhật cấu hình hệ thống thành công")
                .data(configService.updateConfig(key, request, currentUserId))
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
 * 1. PUT /admin/system-configs/shipping_fee
 * curl -X PUT "http://localhost:8080/admin/system-configs/shipping_fee" -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" -d '{"value":"35000","description":"Phí ship mặc định toàn quốc","isPublic":true}'
 */
