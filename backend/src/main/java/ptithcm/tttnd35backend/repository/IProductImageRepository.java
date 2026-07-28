package ptithcm.tttnd35backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ptithcm.tttnd35backend.entity.ProductImage;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface IProductImageRepository extends JpaRepository<ProductImage, UUID> {

    List<ProductImage> findAllByProductIdOrderBySortOrderAsc(UUID productId);

    Optional<ProductImage> findByIdAndProductId(UUID id, UUID productId);

    long countByProductId(UUID productId);
}
