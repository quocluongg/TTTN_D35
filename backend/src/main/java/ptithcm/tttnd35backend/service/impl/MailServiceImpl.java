package ptithcm.tttnd35backend.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import ptithcm.tttnd35backend.service.IMailService;
import ptithcm.tttnd35backend.util.enums.OtpPurpose;

@Slf4j
@Service
@RequiredArgsConstructor
public class MailServiceImpl implements IMailService {

    private final JavaMailSender mailSender;

    @Value("${service.mail.from}")
    private String from;

    @Value("${service.otp.expiration-minutes}")
    private int otpExpirationMinutes;

    @Override
    @Async("mailTaskExecutor")
    public void sendOtpEmail(String to, String otpCode, OtpPurpose purpose) {
        String subject = switch (purpose) {
            case REGISTER -> "Xác thực email đăng ký tài khoản";
            case RESET_PASSWORD -> "Mã xác thực đặt lại mật khẩu";
        };

        String action = switch (purpose) {
            case REGISTER -> "hoàn tất đăng ký tài khoản";
            case RESET_PASSWORD -> "đặt lại mật khẩu";
        };

        String body = """
                Xin chào,

                Mã xác thực (OTP) của bạn để %s là: %s

                Mã có hiệu lực trong %d phút. Vui lòng không chia sẻ mã này cho bất kỳ ai.
                Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email.

                Trân trọng.
                """.formatted(action, otpCode, otpExpirationMinutes);

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(from);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            log.info("Đã gửi email OTP ({}) tới {}", purpose, to);
        } catch (Exception ex) {
            // Không throw ra ngoài vì đang chạy @Async trên thread riêng (caller không bắt được).
            log.error("Gửi email OTP ({}) tới {} thất bại: {}", purpose, to, ex.getMessage(), ex);
        }
    }
}
