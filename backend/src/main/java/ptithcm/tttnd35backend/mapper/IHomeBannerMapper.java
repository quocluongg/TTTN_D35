package ptithcm.tttnd35backend.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import ptithcm.tttnd35backend.dto.request.HomeBannerRequest;
import ptithcm.tttnd35backend.dto.response.HomeBannerResponse;
import ptithcm.tttnd35backend.entity.HomeBanner;

import java.util.List;

@Mapper(componentModel = "spring")
public interface IHomeBannerMapper {

    @Mapping(target = "id", ignore = true)
    HomeBanner toEntity(HomeBannerRequest request);

    HomeBannerResponse toResponse(HomeBanner entity);

    List<HomeBannerResponse> toResponseList(List<HomeBanner> entities);

    @Mapping(target = "id", ignore = true)
    void updateEntityFromRequest(HomeBannerRequest request, @MappingTarget HomeBanner entity);
}
