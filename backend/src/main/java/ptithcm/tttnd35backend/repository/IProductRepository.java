package ptithcm.tttnd35backend.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.domain.Specification;
import ptithcm.tttnd35backend.entity.Product;

import java.util.Optional;
import java.util.UUID;

public interface IProductRepository extends JpaRepository<Product, UUID>, JpaSpecificationExecutor<Product> {

    Optional<Product> findBySlugAndIsActiveTrue(String slug);

    // Dùng cho admin (kể cả sản phẩm đang bị ẩn) khi sửa/xem chi tiết.
    Optional<Product> findBySlug(String slug);

    boolean existsBySlug(String slug);

    /**
     * Override findAll(Specification, Pageable) kèm @EntityGraph để fetch join category
     * trong CÙNG 1 query - tránh N+1 khi map categoryName cho từng dòng ở trang danh sách.
     */
    @EntityGraph(attributePaths = "category")
    Page<Product> findAll(Specification<Product> spec, Pageable pageable);

    // Dùng cho admin (xem/sửa theo id, kể cả sản phẩm đang ẩn), kèm fetch category luôn trong 1 query.
    @EntityGraph(attributePaths = "category")
    Optional<Product> findById(UUID id);
}
