package ptithcm.tttnd35backend.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import ptithcm.tttnd35backend.dto.response.AuditLogResponse;
import ptithcm.tttnd35backend.entity.AuditLog;

import java.util.List;

@Mapper(componentModel = "spring")
public interface IAuditLogMapper {

    @Mapping(target = "actorId", source = "actor.id")
    @Mapping(target = "actorName", source = "actor.fullName")
    @Mapping(target = "actorEmail", source = "actor.email")
    AuditLogResponse toResponse(AuditLog entity);

    List<AuditLogResponse> toResponseList(List<AuditLog> entities);
}
