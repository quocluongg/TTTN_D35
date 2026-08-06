package ptithcm.tttnd35backend.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import ptithcm.tttnd35backend.dto.request.ProductAttributeKeyRequest;
import ptithcm.tttnd35backend.dto.response.ProductAttributeKeyResponse;
import ptithcm.tttnd35backend.entity.ProductAttributeKey;

import java.util.List;

@Mapper(componentModel = "spring")
public interface ProductAttributeKeyMapper {

    @Mapping(target = "id", ignore = true)
    ProductAttributeKey toEntity(ProductAttributeKeyRequest request);

    void updateEntityFromRequest(ProductAttributeKeyRequest request, @MappingTarget ProductAttributeKey key);

    ProductAttributeKeyResponse toResponse(ProductAttributeKey key);

    List<ProductAttributeKeyResponse> toResponseList(List<ProductAttributeKey> keys);
}
