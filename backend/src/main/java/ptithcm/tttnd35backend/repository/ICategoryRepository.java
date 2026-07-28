package ptithcm.tttnd35backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ptithcm.tttnd35backend.entity.Category;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ICategoryRepository extends JpaRepository<Category, UUID> {

    List<Category> findAllByOrderByNameAsc();

    // Tìm các danh mục active
    Optional<Category> findBySlugAndIsActiveTrue(String slug);

    // Dùng cho admin khi sửa/xem chi tiết.
    Optional<Category> findBySlug(String slug);

    boolean existsBySlug(String slug);

    // Kiểm tra danh mục có phải lá hay không (còn danh mục con) - dùng khi gán Product vào Category.
    boolean existsByParentId(UUID parentId);
}
