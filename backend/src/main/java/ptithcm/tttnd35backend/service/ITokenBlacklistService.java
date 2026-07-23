package ptithcm.tttnd35backend.service;

/**
 * Quản lý danh sách access token (JWT) đã bị vô hiệu hóa trước hạn (do logout),
 * dùng Redis với TTL để tự dọn dẹp, không cần cronjob.
 */
public interface ITokenBlacklistService {

    /**
     * Đánh dấu 1 access token (theo jti) là đã bị thu hồi.
     *
     * @param jti                 JWT ID lấy từ claim "jti" của access token
     * @param remainingTtlSeconds thời gian còn lại tới khi token tự hết hạn -> TTL của key Redis
     *                            (không cần lưu lâu hơn, vì token tự hết hạn thì blacklist cũng vô nghĩa)
     */
    void blacklist(String jti, long remainingTtlSeconds);

    /** Kiểm tra 1 access token (theo jti) đã bị thu hồi trước hạn hay chưa. */
    boolean isBlacklisted(String jti);
}
