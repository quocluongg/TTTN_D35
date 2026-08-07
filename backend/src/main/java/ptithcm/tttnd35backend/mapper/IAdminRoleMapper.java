package ptithcm.tttnd35backend.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import ptithcm.tttnd35backend.dto.response.PermissionResponse;
import ptithcm.tttnd35backend.dto.response.RoleResponse;
import ptithcm.tttnd35backend.entity.Permission;
import ptithcm.tttnd35backend.entity.Role;

import java.util.List;

@Mapper(componentModel = "spring")
public interface IAdminRoleMapper {

    @Mapping(target = "permissions", ignore = true)
    RoleResponse toResponse(Role role);

    List<RoleResponse> toResponseList(List<Role> roles);

    PermissionResponse toPermissionResponse(Permission permission);

    List<PermissionResponse> toPermissionResponseList(List<Permission> permissions);
}
