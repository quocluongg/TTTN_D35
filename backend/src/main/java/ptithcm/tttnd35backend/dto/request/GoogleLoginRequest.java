package ptithcm.tttnd35backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GoogleLoginRequest {

    // ID token do Google Identity Services (frontend) cấp sau khi user chọn tài khoản Google,
    // KHÔNG phải authorization code. Backend tự verify token này với Google, không tin frontend.
    @NotBlank(message = "idToken không được để trống")
    private String idToken;
}
