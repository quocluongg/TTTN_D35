package ptithcm.tttnd35backend.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import ptithcm.tttnd35backend.dto.request.BrandLogoRequest;
import ptithcm.tttnd35backend.dto.response.BrandLogoResponse;
import ptithcm.tttnd35backend.entity.BrandLogo;

import java.util.List;

@Mapper(componentModel = "spring")
public interface IBrandLogoMapper {

    @Mapping(target = "id", ignore = true)
    BrandLogo toEntity(BrandLogoRequest request);

    BrandLogoResponse toResponse(BrandLogo entity);

    List<BrandLogoResponse> toResponseList(List<BrandLogo> entities);

    @Mapping(target = "id", ignore = true)
    void updateEntityFromRequest(BrandLogoRequest request, @MappingTarget BrandLogo entity);
}
