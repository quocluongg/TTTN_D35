package ptithcm.tttnd35backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ptithcm.tttnd35backend.entity.RolePermission;
import ptithcm.tttnd35backend.entity.RolePermissionId;

import java.util.UUID;

public interface IRolePermissionRepository extends JpaRepository<RolePermission, RolePermissionId> {

    void deleteByRoleId(UUID roleId);
}
