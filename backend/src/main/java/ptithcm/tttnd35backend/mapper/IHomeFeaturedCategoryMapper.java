package ptithcm.tttnd35backend.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import ptithcm.tttnd35backend.dto.response.HomeFeaturedCategoryItemResponse;
import ptithcm.tttnd35backend.dto.response.HomeFeaturedCategoryResponse;
import ptithcm.tttnd35backend.entity.HomeFeaturedCategory;
import ptithcm.tttnd35backend.entity.HomeFeaturedCategoryItem;

import java.util.List;

@Mapper(componentModel = "spring")
public interface IHomeFeaturedCategoryMapper {

    @Mapping(target = "categoryId", source = "category.id")
    @Mapping(target = "categoryName", source = "category.name")
    @Mapping(target = "categorySlug", source = "category.slug")
    @Mapping(target = "items", ignore = true)
    HomeFeaturedCategoryResponse toResponse(HomeFeaturedCategory entity);

    List<HomeFeaturedCategoryResponse> toResponseList(List<HomeFeaturedCategory> entities);

    @Mapping(target = "featuredCategoryId", source = "featuredCategory.id")
    @Mapping(target = "productId", source = "product.id")
    @Mapping(target = "productName", source = "product.name")
    @Mapping(target = "productThumbnail", source = "product.thumbnail")
    @Mapping(target = "brandLogoId", source = "brandLogo.id")
    @Mapping(target = "brandName", source = "brandLogo.name")
    @Mapping(target = "brandLogoUrl", source = "brandLogo.logoUrl")
    HomeFeaturedCategoryItemResponse toItemResponse(HomeFeaturedCategoryItem item);

    List<HomeFeaturedCategoryItemResponse> toItemResponseList(List<HomeFeaturedCategoryItem> items);
}
