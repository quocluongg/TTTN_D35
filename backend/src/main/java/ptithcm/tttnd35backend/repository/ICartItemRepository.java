package ptithcm.tttnd35backend.repository;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import ptithcm.tttnd35backend.entity.CartItem;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ICartItemRepository extends JpaRepository<CartItem, UUID> {

    // Fetch-join variant để build response tránh N+1.
    @EntityGraph(attributePaths = "variant")
    List<CartItem> findAllByProfileIdOrderByCreatedAtDesc(UUID profileId);

    Optional<CartItem> findByIdAndProfileId(UUID id, UUID profileId);

    Optional<CartItem> findByProfileIdAndVariantId(UUID profileId, UUID variantId);

    void deleteAllByProfileId(UUID profileId);

    long countByProfileId(UUID profileId);
}
