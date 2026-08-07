package ptithcm.tttnd35backend.service;

import ptithcm.tttnd35backend.dto.request.CategoryRequest;
import ptithcm.tttnd35backend.dto.response.CategoryResponse;
import ptithcm.tttnd35backend.dto.response.CategoryTreeResponse;

import java.util.List;
import java.util.UUID;

public interface ICategoryService {

    // Public - chỉ trả danh mục đang active (ẩn cả nhánh con của danh mục cha đang bị ẩn).
    List<CategoryTreeResponse> getTree();

    // Admin - trả toàn bộ cây kể cả danh mục đang ẩn, để còn thấy mà bật lại/sửa.
    List<CategoryTreeResponse> getTreeForAdmin();

    List<CategoryResponse> getBreadcrumb(String slug);

    CategoryResponse create(CategoryRequest request);

    CategoryResponse update(UUID id, CategoryRequest request);

    CategoryResponse setActive(UUID id, boolean active);
}
