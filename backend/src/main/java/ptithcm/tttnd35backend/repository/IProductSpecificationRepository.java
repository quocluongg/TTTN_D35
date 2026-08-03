package ptithcm.tttnd35backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import ptithcm.tttnd35backend.entity.ProductSpecification;

import java.util.List;
import java.util.UUID;

public interface IProductSpecificationRepository extends JpaRepository<ProductSpecification, Long> {

    /**
     * Lấy tất cả thông số của một sản phẩm, eager-fetch attributeKey để tránh N+1.
     * Thứ tự: theo spec_group rồi theo sort_order của attributeKey.
     */
    @Query("""
            SELECT ps FROM ProductSpecification ps
            JOIN FETCH ps.attributeKey ak
            WHERE ps.productId = :productId
            ORDER BY ps.specGroup NULLS LAST, ak.sortOrder ASC, ak.name ASC
            """)
    List<ProductSpecification> findAllByProductIdWithKey(@Param("productId") UUID productId);

    void deleteAllByProductId(UUID productId);
}
