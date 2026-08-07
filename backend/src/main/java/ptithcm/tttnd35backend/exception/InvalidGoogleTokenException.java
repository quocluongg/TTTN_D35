package ptithcm.tttnd35backend.exception;

/** Google ID token không hợp lệ, hết hạn, hoặc không được cấp cho đúng client id của mình. */
public class InvalidGoogleTokenException extends RuntimeException {
    public InvalidGoogleTokenException(String message) {
        super(message);
    }
}
