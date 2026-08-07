package ptithcm.tttnd35backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import ptithcm.tttnd35backend.dto.request.RolePermissionUpdateRequest;
import ptithcm.tttnd35backend.dto.response.ApiResponse;
import ptithcm.tttnd35backend.dto.response.PermissionResponse;
import ptithcm.tttnd35backend.dto.response.RoleResponse;
import ptithcm.tttnd35backend.service.IAdminRoleService;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/admin/roles")
@RequiredArgsConstructor
public class AdminRoleController {

    private final IAdminRoleService roleService;

    @GetMapping
    @PreAuthorize("hasAuthority('ROLE_VIEW') or hasAuthority('ROLE_MANAGE')")
    public ApiResponse<List<RoleResponse>> getAllRoles() {
        return ApiResponse.<List<RoleResponse>>builder()
                .success(true)
                .data(roleService.getAllRoles())
                .timestamp(LocalDateTime.now())
                .build();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_VIEW') or hasAuthority('ROLE_MANAGE')")
    public ApiResponse<RoleResponse> getRoleById(@PathVariable UUID id) {
        return ApiResponse.<RoleResponse>builder()
                .success(true)
                .data(roleService.getRoleById(id))
                .timestamp(LocalDateTime.now())
                .build();
    }

    @PutMapping("/{id}/permissions")
    @PreAuthorize("hasAuthority('ROLE_UPDATE')")
    public ApiResponse<RoleResponse> updatePermissions(@PathVariable UUID id, @RequestBody @Valid RolePermissionUpdateRequest request) {
        return ApiResponse.<RoleResponse>builder()
                .success(true)
                .message("Cập nhật danh sách quyền cho vai trò thành công")
                .data(roleService.updateRolePermissions(id, request))
                .timestamp(LocalDateTime.now())
                .build();
    }

    @GetMapping("/permissions")
    @PreAuthorize("hasAuthority('ROLE_VIEW')")
    public ApiResponse<List<PermissionResponse>> getAllPermissions() {
        return ApiResponse.<List<PermissionResponse>>builder()
                .success(true)
                .data(roleService.getAllPermissions())
                .timestamp(LocalDateTime.now())
                .build();
    }
}
/*
 * Example cURL:
 * 1. PUT /admin/roles/{id}/permissions
 * curl -X PUT "http://localhost:8080/admin/roles/<STAFF_ROLE_UUID>/permissions" -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" -d '{"permissionCodes":["ORDER_VIEW","ORDER_UPDATE","PRODUCT_VIEW"]}'
 */
