package ptithcm.tttnd35backend.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import ptithcm.tttnd35backend.dto.request.CategoryRequest;
import ptithcm.tttnd35backend.dto.response.CategoryResponse;
import ptithcm.tttnd35backend.dto.response.CategoryTreeResponse;
import ptithcm.tttnd35backend.entity.Category;

import java.util.List;

@Mapper(componentModel = "spring")
public interface CategoryMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "slug", ignore = true)
    @Mapping(target = "isActive", ignore = true)
    Category toEntity(CategoryRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "slug", ignore = true)
    void updateEntityFromRequest(CategoryRequest request, @MappingTarget Category category);

    @Mapping(target = "isActive", source = "active")
    CategoryResponse toResponse(Category category);

    List<CategoryResponse> toResponseList(List<Category> categories);

    // children được CategoryServiceImpl tự gán sau khi dựng cây, mapper chỉ map field phẳng.
    @Mapping(target = "isActive", source = "active")
    @Mapping(target = "children", ignore = true)
    CategoryTreeResponse toTreeNode(Category category);
}
