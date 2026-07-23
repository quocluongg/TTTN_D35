package ptithcm.tttnd35backend.service;

import ptithcm.tttnd35backend.dto.request.RegisterRequest;

/**
 * Xử lý nghiệp vụ xác thực người dùng (đăng ký, đăng nhập, quản lý phiên...).
 */
public interface IAuthService {

    /**
     * Đăng ký tài khoản mới bằng email/password. Role mặc định CUSTOMER,
     * tài khoản chưa email_verified, sinh và gửi OTP xác thực email.
     */
    void register(RegisterRequest request);
}
