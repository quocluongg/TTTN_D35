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
     * sinh access token (JWT) + refresh token (random string, hash lưu DB)
     * lưu phiên đăng nhập (device_info/ip_address) để phục vụ thu hồi từng thiết bị sau này.
     */
    AuthResult login(LoginRequest request, String deviceInfo, String ipAddress);
}
