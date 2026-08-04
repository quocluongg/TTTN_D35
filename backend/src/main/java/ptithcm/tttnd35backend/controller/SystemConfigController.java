package ptithcm.tttnd35backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ptithcm.tttnd35backend.dto.response.ApiResponse;
import ptithcm.tttnd35backend.dto.response.SystemConfigResponse;
import ptithcm.tttnd35backend.service.ISystemConfigService;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping({"/api/v1/system-configs", "/system-configs"})
@RequiredArgsConstructor
public class SystemConfigController {

    private final ISystemConfigService configService;

    @GetMapping("/public")
    public ApiResponse<List<SystemConfigResponse>> getPublicConfigs() {
        return ApiResponse.<List<SystemConfigResponse>>builder()
                .success(true)
                .data(configService.getPublicConfigs())
                .timestamp(LocalDateTime.now())
                .build();
    }
}
/*
 * Example cURL:
 * GET /api/v1/system-configs/public
 * curl -X GET "http://localhost:8080/api/v1/system-configs/public"
 */
