package ptithcm.tttnd35backend.service;

import ptithcm.tttnd35backend.dto.internal.GoogleUserInfo;

/** Xác thực Google ID token với Google, trả về thông tin user đã verify. */
public interface IGoogleTokenVerifier {

    /**
     * Gọi Google tokeninfo endpoint để verify chữ ký + hạn của idToken, đối chiếu "aud" đúng
     * client id cấu hình và email đã được Google xác thực.
     * Ném InvalidGoogleTokenException nếu bất kỳ điều kiện nào không thỏa.
     */
    GoogleUserInfo verify(String idToken);
}
