package ptithcm.tttnd35backend.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ptithcm.tttnd35backend.dto.request.CategoryRequest;
import ptithcm.tttnd35backend.dto.response.CategoryResponse;
import ptithcm.tttnd35backend.dto.response.CategoryTreeResponse;
import ptithcm.tttnd35backend.entity.Category;
import ptithcm.tttnd35backend.exception.BadRequestException;
import ptithcm.tttnd35backend.exception.ResourceNotFoundException;
import ptithcm.tttnd35backend.mapper.CategoryMapper;
import ptithcm.tttnd35backend.repository.ICategoryRepository;
import ptithcm.tttnd35backend.service.ICategoryService;
import ptithcm.tttnd35backend.util.helper.SlugUtils;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements ICategoryService {

    private final ICategoryRepository categoryRepository;
    private final CategoryMapper categoryMapper;

    @Override
    public List<CategoryTreeResponse> getTree() {
        // Lọc active TRƯỚC khi dựng cây: nếu 1 danh mục cha bị ẩn thì cả nhánh con (dù đang active)
        // cũng biến mất khỏi cây public, vì buildNode() chỉ đi xuống từ root - không có root nào trỏ
        // tới danh mục cha đã bị lọc thì nhánh đó coi như không tồn tại trong kết quả trả về.
        List<Category> activeOnly = categoryRepository.findAllByOrderByNameAsc().stream()
                .filter(Category::isActive)
                .toList();
        return buildTree(activeOnly);
    }

    @Override
    public List<CategoryTreeResponse> getTreeForAdmin() {
        return buildTree(categoryRepository.findAllByOrderByNameAsc());
    }

    private List<CategoryTreeResponse> buildTree(List<Category> categories) {
        Map<UUID, List<Category>> childrenByParent = new HashMap<>();
        for (Category category : categories) {
            childrenByParent
                    .computeIfAbsent(category.getParentId(), k -> new ArrayList<>())
                    .add(category);
        }

        List<Category> roots = childrenByParent.getOrDefault(null, List.of());
        return roots.stream()
                .map(root -> buildNode(root, childrenByParent))
                .toList();
    }

    private CategoryTreeResponse buildNode(Category category, Map<UUID, List<Category>> childrenByParent) {
        CategoryTreeResponse node = categoryMapper.toTreeNode(category);
        List<Category> children = childrenByParent.getOrDefault(category.getId(), List.of());
        node.setChildren(children.stream()
                .map(child -> buildNode(child, childrenByParent))
                .toList());
        return node;
    }

    @Override
    public List<CategoryResponse> getBreadcrumb(String slug) {
        Category leaf = categoryRepository.findBySlugAndIsActiveTrue(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục"));

        // Cây danh mục không sâu (vài cấp) nên load hết 1 lần rồi truy ngược trong memory,
        // rẻ hơn nhiều so với query từng cấp cha một.
        List<Category> all = categoryRepository.findAllByOrderByNameAsc();
        Map<UUID, Category> byId = all.stream()
                .collect(Collectors.toMap(Category::getId, c -> c));

        List<CategoryResponse> breadcrumb = new ArrayList<>();
        Category current = leaf;
        while (current != null) {
            breadcrumb.add(0, categoryMapper.toResponse(current));
            current = current.getParentId() == null ? null : byId.get(current.getParentId());
        }
        return breadcrumb;
    }

    @Override
    @Transactional
    public CategoryResponse create(CategoryRequest request) {
        validateParent(request.getParentId());

        Category category = categoryMapper.toEntity(request);
        category.setSlug(generateUniqueSlug(request.getName()));
        category.setActive(true);

        return categoryMapper.toResponse(categoryRepository.save(category));
    }

    @Override
    @Transactional
    public CategoryResponse update(UUID id, CategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục"));

        if (request.getParentId() != null && request.getParentId().equals(id)) {
            throw new BadRequestException("Danh mục không thể là cha của chính nó");
        }
        validateParent(request.getParentId());

        // Giữ nguyên slug cũ khi đổi tên (chuẩn SEO, tránh gãy link cũ đã index) - chỉ sinh slug lúc tạo mới.
        categoryMapper.updateEntityFromRequest(request, category);

        return categoryMapper.toResponse(categoryRepository.save(category));
    }

    @Override
    @Transactional
    public CategoryResponse setActive(UUID id, boolean active) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục"));
        category.setActive(active);
        return categoryMapper.toResponse(categoryRepository.save(category));
    }

    private void validateParent(UUID parentId) {
        if (parentId != null && !categoryRepository.existsById(parentId)) {
            throw new BadRequestException("Danh mục cha không tồn tại");
        }
    }

    private String generateUniqueSlug(String name) {
        String base = SlugUtils.toSlug(name);
        String slug = base;
        int suffix = 2;
        while (categoryRepository.existsBySlug(slug)) {
            slug = base + "-" + suffix++;
        }
        return slug;
    }
}
