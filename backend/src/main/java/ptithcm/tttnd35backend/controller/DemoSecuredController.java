package ptithcm.tttnd35backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ptithcm.tttnd35backend.config.security.UserPrincipal;
import ptithcm.tttnd35backend.dto.response.ApiResponse;
import ptithcm.tttnd35backend.dto.response.ProfileResponse;

import java.time.LocalDateTime;

/**
 * Endpoint DEMO cho @PreAuthorize, KHÔNG phải nghiệp vụ thật.
 * Xóa/thay thế các endpoint này khi bắt đầu code module thật (Catalog/Sales...).
 *
 * Authorities của user gồm 2 loại (xem UserPrincipal.getAuthorities()):
 *  - "ROLE_<tên role>"   -> check bằng hasRole("ADMIN")  (Spring tự thêm tiền tố ROLE_ khi gọi hasRole)
 *  - "<code permission>" -> check bằng hasAuthority("PRODUCT_CREATE") (dùng code y hệt trong DB, KHÔNG thêm tiền tố)
 */
@RestController
@RequiredArgsConstructor
public class DemoSecuredController {

    @GetMapping("/auth/me")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<ProfileResponse> me(Authentication authentication) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        var profile = principal.getProfile();

        ProfileResponse response = ProfileResponse.builder()
                .id(profile.getId())
                .email(profile.getEmail())
                .fullName(profile.getFullName())
                .role(profile.getRole().getName())
                .build();

        return ApiResponse.<ProfileResponse>builder()
                .success(true)
                .data(response)
                .timestamp(LocalDateTime.now())
                .build();
    }

    // Case 1 - check theo ROLE: chỉ user có role ADMIN mới gọi được.
    // Dùng khi phân quyền thô theo vai trò, không quan tâm permission chi tiết.
    @GetMapping("/admin/ping")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<?> adminPing() {
        return ApiResponse.builder()
                .success(true)
                .message("pong - bạn có role ADMIN nên mới thấy được dòng này")
                .timestamp(LocalDateTime.now())
                .build();
    }

    // Case 2 - check theo PERMISSION cụ thể: ADMIN và STAFF đều có PRODUCT_CREATE (theo seed V4)
    // nên cả 2 role đều gọi được, nhưng CUSTOMER thì không -> đây mới là cách check "đúng chuẩn"
    // cho nghiệp vụ thật, vì permission linh hoạt hơn hardcode role.
    @GetMapping("/demo/product-permission-check")
    @PreAuthorize("hasAuthority('PRODUCT_CREATE')")
    public ApiResponse<?> checkProductCreatePermission() {
        return ApiResponse.builder()
                .success(true)
                .message("Bạn có quyền PRODUCT_CREATE (role ADMIN hoặc STAFF đều thấy được dòng này)")
                .timestamp(LocalDateTime.now())
                .build();
    }

    // Case 3 - kết hợp cả role lẫn permission bằng biểu thức SpEL (AND/OR).
    // Ví dụ: ADMIN thì luôn qua (không cần permission), HOẶC bất kỳ ai có USER_MANAGE cũng qua được.
    @GetMapping("/demo/combined-check")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('USER_MANAGE')")
    public ApiResponse<?> combinedCheck() {
        return ApiResponse.builder()
                .success(true)
                .message("Bạn là ADMIN hoặc có quyền USER_MANAGE")
                .timestamp(LocalDateTime.now())
                .build();
    }
}