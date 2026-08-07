package ptithcm.tttnd35backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ptithcm.tttnd35backend.entity.ProductAttributeKey;

import java.util.List;
import java.util.Optional;

public interface IProductAttributeKeyRepository extends JpaRepository<ProductAttributeKey, Integer> {

    Optional<ProductAttributeKey> findByName(String name);

    boolean existsByName(String name);

    List<ProductAttributeKey> findAllByOrderBySortOrderAscNameAsc();
}
