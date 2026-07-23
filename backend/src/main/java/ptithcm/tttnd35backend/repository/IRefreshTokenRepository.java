package ptithcm.tttnd35backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import ptithcm.tttnd35backend.entity.RefreshToken;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface IRefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {
    Optional<RefreshToken> findByTokenHash(String tokenHash);

    void deleteAllByProfileId(UUID profileId);

    /**
     * Revoke toàn bộ refresh token còn hiệu lực của 1 profile.
     * Dùng khi phát hiện 1 token đã bị revoke nhưng vẫn có đem đi refresh
     * (dấu hiệu token bị đánh cắp) -> ép đăng nhập lại trên MỌI thiết bị.
     */
    @Modifying
    @Query("UPDATE RefreshToken r SET r.revoked = true WHERE r.profile.id = :profileId AND r.revoked = false")
    void revokeAllActiveByProfileId(UUID profileId);
}
