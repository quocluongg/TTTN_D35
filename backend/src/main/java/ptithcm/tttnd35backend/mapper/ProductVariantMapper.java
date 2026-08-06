package ptithcm.tttnd35backend.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import ptithcm.tttnd35backend.dto.request.ProductVariantAdminRequest;
import ptithcm.tttnd35backend.dto.response.ProductVariantResponse;
import ptithcm.tttnd35backend.entity.ProductVariant;

import java.util.List;

@Mapper(componentModel = "spring")
public interface ProductVariantMapper {

    // Builder-target (không có @MappingTarget) -> ProductVariantResponse.builder().isActive(...) nên phải khai
    // báo target="isActive"; source lấy qua getter entity isActive() -> MapStruct tự strip "is" thành "active".
    @Mapping(target = "isActive", source = "active")
    ProductVariantResponse toResponse(ProductVariant variant);

    List<ProductVariantResponse> toResponseList(List<ProductVariant> variants);

    // id, productId, sku, variantName do Service tự set (sku sinh từ sequence, variantName build từ attributes).
    // isActive không có trong request (mặc định true qua @Builder.Default trên entity) -> không khai báo gì.
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "productId", ignore = true)
    @Mapping(target = "sku", ignore = true)
    @Mapping(target = "variantName", ignore = true)
    ProductVariant toEntity(ProductVariantAdminRequest request);

    // @MappingTarget-path -> setter thật là setActive() (Lombok lược "is"), nhưng request không có field
    // này nên không cần khai báo gì cho isActive/active ở đây.
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "productId", ignore = true)
    @Mapping(target = "sku", ignore = true)
    @Mapping(target = "variantName", ignore = true)
    void updateEntityFromRequest(ProductVariantAdminRequest request, @MappingTarget ProductVariant variant);
}
