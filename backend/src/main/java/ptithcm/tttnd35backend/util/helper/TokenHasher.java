package ptithcm.tttnd35backend.util.helper;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * Hàm băm (hash) dùng riêng cho refresh token.
 *
 * Không dùng BCrypt như mật khẩu/OTP vì:
 * - BCrypt: mỗi lần băm cùng 1 chuỗi sẽ ra kết quả KHÁC nhau (có yếu tố ngẫu nhiên trộn vào).
 *   Chỉ dùng được khi đã biết trước "so với dòng dữ liệu nào" (ví dụ: đã biết đúng user,
 *   chỉ cần so mật khẩu nhập vào có khớp với mật khẩu đã lưu của user đó không).
 * - Refresh token thì khác: hệ thống nhận 1 chuỗi từ cookie mà CHƯA biết nó thuộc về ai,
 *   phải tự tra trong toàn bộ database xem có dòng nào khớp không.
 *   Muốn tra được, hàm băm phải cho ra kết quả GIỐNG NHAU với cùng 1 input (deterministic)
 */
public final class TokenHasher {

    private static final SecureRandom RANDOM = new SecureRandom();

    private TokenHasher() {
    }

    /** Sinh 1 refresh token raw ngẫu nhiên (256 bit), encode base64 url-safe. */
    public static String generateRawToken() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    public static String sha256(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 không khả dụng trên môi trường này", e);
        }
    }
}