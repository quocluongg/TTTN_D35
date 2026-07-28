package ptithcm.tttnd35backend.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import ptithcm.tttnd35backend.dto.request.CampaignRequest;
import ptithcm.tttnd35backend.dto.response.CampaignResponse;
import ptithcm.tttnd35backend.entity.Campaign;

@Mapper(componentModel = "spring")
public interface CampaignMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "isActive", source = "active")
    Campaign toEntity(CampaignRequest request);

    @Mapping(target = "id", ignore = true)
    void updateEntityFromRequest(CampaignRequest request, @MappingTarget Campaign campaign);

    @Mapping(target = "isActive", source = "active")
    @Mapping(target = "currentlyRunning", ignore = true)
    CampaignResponse toResponse(Campaign campaign);
}
