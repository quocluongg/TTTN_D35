package ptithcm.tttnd35backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import ptithcm.tttnd35backend.dto.request.UserCreateRequest;
import ptithcm.tttnd35backend.dto.request.UserLockRequest;
import ptithcm.tttnd35backend.dto.request.UserUpdateRequest;
import ptithcm.tttnd35backend.dto.response.ApiResponse;
import ptithcm.tttnd35backend.dto.response.UserAdminResponse;
import ptithcm.tttnd35backend.dto.response.pagination.PageResponse;
import ptithcm.tttnd35backend.service.IAdminUserService;

import java.time.LocalDateTime;
import java.util.UUID;

@RestController
@RequestMapping("/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final IAdminUserService adminUserService;

    @GetMapping
    @PreAuthorize("hasAuthority('USER_VIEW')")
    public ApiResponse<PageResponse<UserAdminResponse>> getUsers(
            @RequestParam(required = false) String role,
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        var pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ApiResponse.<PageResponse<UserAdminResponse>>builder()
                .success(true)
                .data(adminUserService.getUsers(role, isActive, search, pageable))
                .timestamp(LocalDateTime.now())
                .build();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('USER_VIEW')")
    public ApiResponse<UserAdminResponse> getUserById(@PathVariable UUID id) {
        return ApiResponse.<UserAdminResponse>builder()
                .success(true)
                .data(adminUserService.getUserById(id))
                .timestamp(LocalDateTime.now())
                .build();
    }

    @PostMapping
    @PreAuthorize("hasAuthority('USER_CREATE')")
    public ApiResponse<UserAdminResponse> createUser(@RequestBody @Valid UserCreateRequest request) {
        return ApiResponse.<UserAdminResponse>builder()
                .success(true)
                .message("Tạo tài khoản nhân viên thành công. Mật khẩu tạm thời đã được gửi qua email.")
                .data(adminUserService.createUser(request))
                .timestamp(LocalDateTime.now())
                .build();
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasAuthority('USER_UPDATE')")
    public ApiResponse<UserAdminResponse> updateUser(@PathVariable UUID id, @RequestBody @Valid UserUpdateRequest request) {
        return ApiResponse.<UserAdminResponse>builder()
                .success(true)
                .message("Cập nhật thông tin tài khoản thành công")
                .data(adminUserService.updateUser(id, request))
                .timestamp(LocalDateTime.now())
                .build();
    }

    @PatchMapping("/{id}/lock")
    @PreAuthorize("hasAuthority('USER_LOCK')")
    public ApiResponse<UserAdminResponse> lockUser(@PathVariable UUID id, @RequestBody @Valid UserLockRequest request) {
        return ApiResponse.<UserAdminResponse>builder()
                .success(true)
                .message(request.isActive() ? "Mở khóa tài khoản thành công" : "Đã khóa tài khoản thành công")
                .data(adminUserService.lockUser(id, request))
                .timestamp(LocalDateTime.now())
                .build();
    }
}
/*
 * Example cURL:
 * 1. POST /admin/users
 * curl -X POST "http://localhost:8080/admin/users" -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" -d '{"email":"staff1@shopwise.com","fullName":"Nhân Viên A","roleId":"<STAFF_ROLE_UUID>"}'
 */
