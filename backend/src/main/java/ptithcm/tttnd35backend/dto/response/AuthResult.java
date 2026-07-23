package ptithcm.tttnd35backend.dto.response;

import lombok.*;

/**
 * Kết quả nội bộ của login/refresh, KHÔNG trả ra client.
 * 2 phần: accessToken (JSON body) và rawRefreshToken (set vào HttpOnly cookie).
 */
@Getter
@Builder
public class AuthResult {
    private TokenResponse tokenResponse;
    private String rawRefreshToken;
    private long refreshExpirationMs;
}
