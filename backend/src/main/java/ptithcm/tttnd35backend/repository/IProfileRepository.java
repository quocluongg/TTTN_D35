package ptithcm.tttnd35backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import ptithcm.tttnd35backend.entity.Profile;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface IProfileRepository extends JpaRepository<Profile, UUID> {

    Optional<Profile> findByEmail(String email);

    boolean existsByEmail(String email);

    /**
     * Dùng cho lúc login/authentication: lấy Profile kèm Role + Permission
     */
    @Query("""
            SELECT p FROM Profile p
            JOIN FETCH p.role r
            LEFT JOIN FETCH r.rolePermissions rp
            LEFT JOIN FETCH rp.permission
            WHERE p.email = :email
            """)
    Optional<Profile> findByEmailWithRoleAndPermissions(String email);
}
