package ptithcm.tttnd35backend.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import ptithcm.tttnd35backend.dto.response.SystemConfigResponse;
import ptithcm.tttnd35backend.entity.SystemConfig;

import java.util.List;

@Mapper(componentModel = "spring")
public interface ISystemConfigMapper {

    @Mapping(target = "updatedById", source = "updatedBy.id")
    @Mapping(target = "updatedByName", source = "updatedBy.fullName")
    SystemConfigResponse toResponse(SystemConfig entity);

    List<SystemConfigResponse> toResponseList(List<SystemConfig> entities);
}
