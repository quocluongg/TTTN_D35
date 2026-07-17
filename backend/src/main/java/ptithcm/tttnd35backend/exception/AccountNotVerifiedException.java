package ptithcm.tttnd35backend.exception;

/** Tài khoản chưa xác thực email (chưa bấm OTP), chưa được phép đăng nhập. */
public class AccountNotVerifiedException extends RuntimeException {
    public AccountNotVerifiedException(String message) {
        super(message);
    }
}
