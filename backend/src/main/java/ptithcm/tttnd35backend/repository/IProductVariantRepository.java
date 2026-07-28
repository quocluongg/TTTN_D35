package ptithcm.tttnd35backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import ptithcm.tttnd35backend.entity.ProductVariant;
import ptithcm.tttnd35backend.repository.projection.ProductMinPriceProjection;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface IProductVariantRepository extends JpaRepository<ProductVariant, UUID> {

    List<ProductVariant> findAllByProductId(UUID productId);

    Optional<ProductVariant> findByIdAndProductId(UUID id, UUID productId);

    boolean existsBySku(String sku);

    long countByProductId(UUID productId);

    // 1 query MIN(price) group theo productId cho cả trang sản phẩm - tránh phải load hết variants
    // của từng sản phẩm chỉ để lấy giá thấp nhất hiển thị "Từ x đ".
    @Query("""
            select v.productId as productId, min(v.price) as minPrice
            from ProductVariant v
            where v.productId in :productIds
            group by v.productId
            """)
    List<ProductMinPriceProjection> findMinPriceByProductIds(List<UUID> productIds);

    // Sequence riêng cho SKU, tăng an toàn kể cả nhiều admin tạo variant cùng lúc (không dùng COUNT(*)).
    @Query(value = "select nextval('product_variant_sku_seq')", nativeQuery = true)
    long nextSkuSequenceValue();
}
