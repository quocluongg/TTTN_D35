package ptithcm.tttnd35backend.service;

import ptithcm.tttnd35backend.dto.request.LoginRequest;
import ptithcm.tttnd35backend.dto.request.RegisterRequest;
import ptithcm.tttnd35backend.dto.request.VerifyOtpRequest;
import ptithcm.tttnd35backend.dto.response.AuthResult;

/**
 * Xử lý nghiệp vụ xác thực người dùng (đăng ký, đăng nhập, quản lý phiên...).
 */
public interface IAuthService {

    /**
     * Đăng ký tài khoản mới bằng email/password. Gán role mặc định CUSTOMER,
     * tài khoản chưa email_verified, sinh và gửi OTP xác thực email.
     */
    void register(RegisterRequest request);

    /**
     * Xác thực email bằng OTP đã gửi lúc đăng ký. Đúng thì set email_verified = true.
     */
    void verifyOtp(VerifyOtpRequest request);

    /**
     * Gửi lại OTP xác thực đăng ký (dùng khi email trước hết hạn/không nhận được).
     * Không dùng cho purpose RESET_PASSWORD (có forgotPassword riêng ở bước sau).
     */
    void resendRegisterOtp(String email);

    /**
     * Đăng nhập bằng email/password. Kiểm tra is_active, email_verified, mật khẩu đúng,
     * sinh access token (JWT) + refresh token (random string, hash lưu DB), lưu phiên đăng nhập
     * (device_info/ip_address) để phục vụ thu hồi từng thiết bị sau này.
     */
    AuthResult login(LoginRequest request, String deviceInfo, String ipAddress);

    /**
     * Cấp access token + refresh token mới từ 1 refresh token còn hiệu lực (rotation:
     * token cũ bị revoke ngay). Nếu raw token đưa vào trỏ tới 1 bản ghi ĐÃ revoked từ trước
     * (nghĩa là có người dùng lại token cũ đã bị thay thế) -> coi là dấu hiệu bị đánh cắp,
     * revoke luôn toàn bộ phiên đăng nhập khác của user, ném lỗi bắt đăng nhập lại.
     */
    AuthResult refreshToken(String rawRefreshToken, String deviceInfo, String ipAddress);

    /**
     * Đăng xuất: revoke refresh token hiện tại + đưa access token hiện tại vào blacklist Redis
     * (vì access token là JWT stateless, không "xóa" được, chỉ có thể đánh dấu không hợp lệ trước hạn).
     */
    void logout(String rawRefreshToken, String accessToken);
}
