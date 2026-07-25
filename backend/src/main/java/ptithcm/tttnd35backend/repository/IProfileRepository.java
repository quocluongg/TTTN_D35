package ptithcm.tttnd35backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import ptithcm.tttnd35backend.entity.Profile;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.query.Param;

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

    @Query("""
            select p from Profile p join fetch p.role r
            where (:search is null or lower(p.email) like lower(concat('%', :search, '%'))
                or lower(coalesce(p.fullName, '')) like lower(concat('%', :search, '%')))
            and (:role is null or r.name = :role) and (:active is null or p.isActive = :active)
            """)
    Page<Profile> search(@Param("search") String search, @Param("role") String role,
                         @Param("active") Boolean active, Pageable pageable);
}
