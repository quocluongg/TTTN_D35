package ptithcm.tttnd35backend.dto.response;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TokenResponse {
    private String accessToken;
    private String tokenType; // "Bearer"
    private long expiresIn;   // giây
    // RefreshToken được trả về qua HttpOnly cookie
}
