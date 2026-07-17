package ptithcm.tttnd35backend.exception;

/** Refresh token không tồn tại trong DB, đã bị revoke, hoặc đã hết hạn theo bản ghi lưu. */
public class InvalidRefreshTokenException extends RuntimeException {
    public InvalidRefreshTokenException(String message) {
        super(message);
    }
}
