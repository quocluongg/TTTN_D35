package ptithcm.tttnd35backend.mapper;

import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.Mapper;
import ptithcm.tttnd35backend.dto.request.ProductAdminRequest;
import ptithcm.tttnd35backend.dto.response.ProductDetailResponse;
import ptithcm.tttnd35backend.dto.response.ProductListItemResponse;
import ptithcm.tttnd35backend.entity.Product;

@Mapper(componentModel = "spring")
public interface ProductMapper {

    // id, slug, category, customTabs, ratingAvg, reviewCount, isActive do Service tự xử lý
    // (slug tự sinh, category load từ categoryId, customTabs build JsonNode qua CustomTabJsonUtil).
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "slug", ignore = true)
    @Mapping(target = "category", ignore = true)
    @Mapping(target = "customTabs", ignore = true)
    @Mapping(target = "ratingAvg", ignore = true)
    @Mapping(target = "reviewCount", ignore = true)
    @Mapping(target = "isActive", ignore = true)
    Product toEntity(ProductAdminRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "slug", ignore = true)
    @Mapping(target = "category", ignore = true)
    @Mapping(target = "customTabs", ignore = true)
    @Mapping(target = "ratingAvg", ignore = true)
    @Mapping(target = "reviewCount", ignore = true)
    void updateEntityFromRequest(ProductAdminRequest request, @MappingTarget Product product);

    // customTabs: entity là JsonNode (cần chuẩn hóa), DTO là List<CustomTabResponse>
    // -> khác kiểu, MapStruct không tự map được, Service gán thủ công qua CustomTabJsonUtil sau khi gọi mapper.
    // categoryBreadcrumb/variants/images cũng do Service gán sau.
    @Mapping(target = "isActive", source = "active")
    @Mapping(target = "customTabs", ignore = true)
    @Mapping(target = "categoryBreadcrumb", ignore = true)
    @Mapping(target = "variants", ignore = true)
    @Mapping(target = "images", ignore = true)
    ProductDetailResponse toDetailResponse(Product product);

    // priceFrom/categoryName gán thủ công ở Service (không có sẵn trên entity Product).
    @Mapping(target = "isActive", source = "active")
    @Mapping(target = "categoryName", source = "category.name")
    @Mapping(target = "priceFrom", ignore = true)
    ProductListItemResponse toListItem(Product product);
}
