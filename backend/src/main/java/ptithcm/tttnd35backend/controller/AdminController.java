package ptithcm.tttnd35backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import ptithcm.tttnd35backend.config.security.UserPrincipal;
import ptithcm.tttnd35backend.dto.request.AdminUserRequest;
import ptithcm.tttnd35backend.dto.request.UpdateAdminUserRequest;
import ptithcm.tttnd35backend.dto.request.UpdateConfigRequest;
import ptithcm.tttnd35backend.dto.response.ApiResponse;
import ptithcm.tttnd35backend.dto.response.AdminUserResponse;
import ptithcm.tttnd35backend.dto.response.pagination.PageResponse;
import ptithcm.tttnd35backend.entity.SystemConfig;
import ptithcm.tttnd35backend.service.AdminService;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminController {
    private final AdminService service;
    private <T> ResponseEntity<ApiResponse<T>> ok(T data) { return ResponseEntity.ok(ApiResponse.<T>builder().success(true).data(data).timestamp(LocalDateTime.now()).build()); }

    @GetMapping("/users") @PreAuthorize("hasAuthority('USER_VIEW')")
    public ResponseEntity<ApiResponse<PageResponse<AdminUserResponse>>> users(
            @RequestParam(required = false) String search, @RequestParam(required = false) String role,
            @RequestParam(required = false) Boolean active, @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) { return ok(service.users(search, role, active, page, size)); }

    @GetMapping("/users/{id}") @PreAuthorize("hasAuthority('USER_VIEW')")
    public ResponseEntity<ApiResponse<AdminUserResponse>> user(@PathVariable UUID id) { return ok(service.user(id)); }

    @PostMapping("/users") @PreAuthorize("hasAuthority('USER_CREATE')")
    public ResponseEntity<ApiResponse<AdminUserResponse>> create(@Valid @RequestBody AdminUserRequest request, @AuthenticationPrincipal UserPrincipal principal) { return ok(service.createUser(request, principal.getProfile())); }

    @PatchMapping("/users/{id}") @PreAuthorize("hasAuthority('USER_UPDATE')")
    public ResponseEntity<ApiResponse<AdminUserResponse>> update(@PathVariable UUID id, @Valid @RequestBody UpdateAdminUserRequest request, @AuthenticationPrincipal UserPrincipal principal) { return ok(service.updateUser(id, request, principal.getProfile())); }

    @GetMapping("/roles") @PreAuthorize("hasAuthority('ROLE_VIEW')")
    public ResponseEntity<ApiResponse<List<Map<String,Object>>>> roles() { return ok(service.roles()); }

    @GetMapping("/system-config") @PreAuthorize("hasAuthority('SYSTEM_CONFIG_VIEW')")
    public ResponseEntity<ApiResponse<List<SystemConfig>>> configs() { return ok(service.configs()); }

    @PatchMapping("/system-config/{key}") @PreAuthorize("hasAuthority('SYSTEM_CONFIG_UPDATE')")
    public ResponseEntity<ApiResponse<SystemConfig>> config(@PathVariable String key, @Valid @RequestBody UpdateConfigRequest request, @AuthenticationPrincipal UserPrincipal principal) { return ok(service.updateConfig(key, request.value(), principal.getProfile())); }

    @GetMapping("/audit-logs") @PreAuthorize("hasAuthority('AUDIT_LOG_VIEW')")
    public ResponseEntity<ApiResponse<PageResponse<Map<String,Object>>>> auditLogs(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) { return ok(service.auditLogs(page, size)); }
}
