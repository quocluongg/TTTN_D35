package ptithcm.tttnd35backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ptithcm.tttnd35backend.entity.Permission;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface IPermissionRepository extends JpaRepository<Permission, UUID> {
    Optional<Permission> findByCode(String code);
}
