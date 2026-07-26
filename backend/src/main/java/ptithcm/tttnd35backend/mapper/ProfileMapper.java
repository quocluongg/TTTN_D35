package ptithcm.tttnd35backend.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import ptithcm.tttnd35backend.dto.response.ProfileResponse;
import ptithcm.tttnd35backend.entity.Profile;

@Mapper(componentModel = "spring")
public interface ProfileMapper {

    @Mapping(target = "role", source = "role.name")
    ProfileResponse toResponse(Profile profile);
}
