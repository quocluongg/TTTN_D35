package ptithcm.tttnd35backend.mapper;

import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.Mapper;
import ptithcm.tttnd35backend.dto.request.ProductAdminRequest;
import ptithcm.tttnd35backend.dto.response.CustomTabResponse;
import ptithcm.tttnd35backend.dto.response.ProductDetailResponse;
import ptithcm.tttnd35backend.dto.response.ProductListItemResponse;
import ptithcm.tttnd35backend.entity.Product;
import ptithcm.tttnd35backend.entity.jsonb.CustomTabItem;

import java.util.List;

@Mapper(componentModel = "spring")
public interface ProductMapper {

    // id, slug, category, customTabs, ratingAvg, reviewCount, isActive do Service tự xử lý
    // (slug tự sinh, category load từ categoryId, customTabs map thủ công CustomTabRequest -> CustomTabItem).
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
    @Mapping(target = "isActive", ignore = true)
    void updateEntityFromRequest(ProductAdminRequest request, @MappingTarget Product product);

    // Phần field phẳng của trang chi tiết. categoryBreadcrumb/variants/images do Service gán sau.
    @Mapping(target = "isActive", source = "active")
    @Mapping(target = "customTabs", source = "customTabs")
    @Mapping(target = "categoryBreadcrumb", ignore = true)
    @Mapping(target = "variants", ignore = true)
    @Mapping(target = "images", ignore = true)
    ProductDetailResponse toDetailResponse(Product product);

    CustomTabResponse toCustomTabResponse(CustomTabItem item);

    List<CustomTabResponse> toCustomTabResponseList(List<CustomTabItem> items);

    // priceFrom/categoryName gán thủ công ở Service (không có sẵn trên entity Product).
    @Mapping(target = "isActive", source = "active")
    @Mapping(target = "categoryName", source = "category.name")
    @Mapping(target = "priceFrom", ignore = true)
    ProductListItemResponse toListItem(Product product);
}
