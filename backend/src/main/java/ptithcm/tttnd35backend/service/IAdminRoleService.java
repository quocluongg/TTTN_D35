package ptithcm.tttnd35backend.service;

import ptithcm.tttnd35backend.dto.request.RolePermissionUpdateRequest;
import ptithcm.tttnd35backend.dto.response.PermissionResponse;
import ptithcm.tttnd35backend.dto.response.RoleResponse;

import java.util.List;
import java.util.UUID;

public interface IAdminRoleService {

    List<RoleResponse> getAllRoles();

    RoleResponse getRoleById(UUID id);

    RoleResponse updateRolePermissions(UUID roleId, RolePermissionUpdateRequest request);

    List<PermissionResponse> getAllPermissions();
}
