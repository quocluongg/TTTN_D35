package ptithcm.tttnd35backend.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import ptithcm.tttnd35backend.dto.response.UserAdminResponse;
import ptithcm.tttnd35backend.entity.Profile;

import java.util.List;

@Mapper(componentModel = "spring")
public interface IAdminUserMapper {

    @Mapping(target = "roleId", source = "role.id")
    @Mapping(target = "roleName", source = "role.name")
    UserAdminResponse toResponse(Profile profile);

    List<UserAdminResponse> toResponseList(List<Profile> profiles);
}
