package ptithcm.tttnd35backend.service;

import ptithcm.tttnd35backend.util.enums.OtpPurpose;

/**
 * Interface gửi mail chung (Tái sử dụng sau này)
 * Sau này đổi sang SES/SendGrid/Resend chỉ cần viết impl mới, không đụng OtpService/AuthService.
 */
public interface IMailService {

    /**
     * Gửi mã OTP qua email.
     *
     * @param to      email người nhận
     * @param otpCode mã OTP dạng plain-text (chưa hash) để hiển thị trong nội dung mail
     * @param purpose mục đích OTP (REGISTER / RESET_PASSWORD) để tùy biến nội dung mail
     */
    void sendOtpEmail(String to, String otpCode, OtpPurpose purpose);
}
