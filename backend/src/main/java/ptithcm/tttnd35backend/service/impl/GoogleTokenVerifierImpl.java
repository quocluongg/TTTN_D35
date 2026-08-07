package ptithcm.tttnd35backend.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import ptithcm.tttnd35backend.dto.internal.GoogleTokenInfoResponse;
import ptithcm.tttnd35backend.dto.internal.GoogleUserInfo;
import ptithcm.tttnd35backend.exception.InvalidGoogleTokenException;
import ptithcm.tttnd35backend.service.IGoogleTokenVerifier;

@Service
@RequiredArgsConstructor
public class GoogleTokenVerifierImpl implements IGoogleTokenVerifier {

    private static final String TOKENINFO_URL = "https://oauth2.googleapis.com/tokeninfo?id_token=";

    private final RestClient restClient;

    @Value("${service.google.client-id}")
    private String googleClientId;

    @Override
    public GoogleUserInfo verify(String idToken) {
        GoogleTokenInfoResponse info;
        try {
            info = restClient.get()
                    .uri(TOKENINFO_URL + idToken)
                    .retrieve()
                    .body(GoogleTokenInfoResponse.class);
        } catch (Exception ex) {
            // Google trả 400 nếu token sai định dạng/hết hạn/đã bị revoke -> RestClient ném exception
            throw new InvalidGoogleTokenException("Google ID token không hợp lệ hoặc đã hết hạn");
        }

        if (info == null || info.getAud() == null || !info.getAud().equals(googleClientId)) {
            throw new InvalidGoogleTokenException("Google ID token không được cấp cho ứng dụng này");
        }

        if (!"true".equalsIgnoreCase(info.getEmailVerified())) {
            throw new InvalidGoogleTokenException("Email Google chưa được xác thực");
        }

        return GoogleUserInfo.builder()
                .providerUserId(info.getSub())
                .email(info.getEmail())
                .fullName(info.getName())
                .build();
    }
}
