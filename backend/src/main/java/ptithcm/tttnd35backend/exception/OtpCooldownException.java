package ptithcm.tttnd35backend.exception;

/** Yêu cầu gửi lại OTP quá sớm, chưa hết thời gian cooldown. */
public class OtpCooldownException extends RuntimeException {
    public OtpCooldownException(String message) {
        super(message);
    }
}
