package ptithcm.tttnd35backend.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ptithcm.tttnd35backend.entity.OtpVerification;
import ptithcm.tttnd35backend.entity.Profile;
import ptithcm.tttnd35backend.exception.InvalidOtpException;
import ptithcm.tttnd35backend.exception.OtpCooldownException;
import ptithcm.tttnd35backend.repository.IOtpVerificationRepository;
import ptithcm.tttnd35backend.service.IMailService;
import ptithcm.tttnd35backend.service.IOtpService;
import ptithcm.tttnd35backend.util.enums.OtpPurpose;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;

/**
 * Sinh, gửi và xác thực mã OTP.
 * - OTP được hash bằng chính PasswordEncoder (BCrypt) đang dùng cho password, đồng bộ 1 cách hash duy nhất.
 * - Cooldown resend + giới hạn thời gian sống dựa vào Redis (key theo profileId+purpose) để không phải
 *   query DB mỗi lần check, đồng thời tận dụng TTL tự dọn dẹp của Redis.
 */
@Service
@RequiredArgsConstructor
public class OtpServiceImpl implements IOtpService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final IOtpVerificationRepository otpVerificationRepository;
    private final PasswordEncoder passwordEncoder;
    private final IMailService mailService;
    private final StringRedisTemplate redisTemplate;

    @Value("${service.otp.expiration-minutes}")
    private int expirationMinutes;

    @Value("${service.otp.resend-cooldown-seconds}")
    private long resendCooldownSeconds;

    @Value("${service.otp.max-attempts}")
    private int maxAttempts;

    /**
     * Sinh OTP mới, lưu DB (hash) và gửi mail. Chặn resend nếu vẫn còn cooldown.
     */
    @Transactional
    public void generateAndSend(Profile profile, OtpPurpose purpose) {
        String cooldownKey = cooldownKey(profile.getId().toString(), purpose);
        Boolean cooldownSet = redisTemplate.opsForValue()
                .setIfAbsent(cooldownKey, "1", Duration.ofSeconds(resendCooldownSeconds));

        if (Boolean.FALSE.equals(cooldownSet)) {
            throw new OtpCooldownException(
                    "Bạn vừa yêu cầu gửi mã, vui lòng thử lại sau ít phút");
        }

        String otpCode = generateOtpCode();

        OtpVerification otp = OtpVerification.builder()
                .profile(profile)
                .otpHash(passwordEncoder.encode(otpCode))
                .purpose(purpose)
                .expiresAt(LocalDateTime.now().plusMinutes(expirationMinutes))
                .verified(false)
                .attemptCount(0)
                .build();
        otpVerificationRepository.save(otp);

        mailService.sendOtpEmail(profile.getEmail(), otpCode, purpose);
    }

    /**
     * Xác thực OTP. Ném InvalidOtpException nếu sai/hết hạn/đã dùng/vượt số lần thử.
     */
    @Transactional
    public void verify(Profile profile, String code, OtpPurpose purpose) {
        OtpVerification otp = otpVerificationRepository
                .findFirstByProfileIdAndPurposeAndVerifiedFalseOrderByCreatedAtDesc(profile.getId(), purpose)
                .orElseThrow(() -> new InvalidOtpException("Không tìm thấy mã OTP, vui lòng yêu cầu gửi lại"));

        if (otp.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new InvalidOtpException("Mã OTP đã hết hạn, vui lòng yêu cầu gửi lại");
        }

        if (otp.getAttemptCount() >= maxAttempts) {
            throw new InvalidOtpException("Bạn đã nhập sai quá số lần cho phép, vui lòng yêu cầu gửi lại mã mới");
        }

        if (!passwordEncoder.matches(code, otp.getOtpHash())) {
            otp.setAttemptCount(otp.getAttemptCount() + 1);
            otpVerificationRepository.save(otp);
            throw new InvalidOtpException("Mã OTP không chính xác");
        }

        otp.setVerified(true);
        otpVerificationRepository.save(otp);
    }

    private String generateOtpCode() {
        int code = RANDOM.nextInt(1_000_000); // 0 -> 999999
        return String.format("%06d", code);
    }

    private String cooldownKey(String profileId, OtpPurpose purpose) {
        return "otp:cooldown:%s:%s".formatted(profileId, purpose);
    }
}
