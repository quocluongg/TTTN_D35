package ptithcm.tttnd35backend.dto.internal;

import lombok.Builder;
import lombok.Getter;

/** Thông tin đã được xác thực từ Google, dùng nội bộ để tạo/đăng nhập Profile. */
@Getter
@Builder
public class GoogleUserInfo {
    private String providerUserId; // Google "sub" - định danh Google duy nhất, không đổi
    private String email;
    private String fullName;
}
