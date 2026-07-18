package ptithcm.tttnd35backend.exception;

/** OTP sai, đã dùng rồi, hoặc hết hạn. */
public class InvalidOtpException extends RuntimeException {
    public InvalidOtpException(String message) {
        super(message);
    }
}
