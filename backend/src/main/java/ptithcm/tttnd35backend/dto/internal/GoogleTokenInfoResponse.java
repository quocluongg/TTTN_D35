package ptithcm.tttnd35backend.dto.internal;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

/**
 * Map response JSON từ Google tokeninfo endpoint
 * (https://oauth2.googleapis.com/tokeninfo?id_token=...). Google tự verify chữ ký + hạn token,
 * mình chỉ cần đối chiếu lại "aud" (đúng client id của mình) và "email_verified".
 */
@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class GoogleTokenInfoResponse {

    private String sub;
    private String email;
    private String aud;
    private String name;

    @JsonProperty("email_verified")
    private String emailVerified; // Google trả về chuỗi "true"/"false"
}
