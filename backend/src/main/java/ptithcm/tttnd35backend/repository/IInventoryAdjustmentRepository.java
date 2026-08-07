package ptithcm.tttnd35backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ptithcm.tttnd35backend.entity.InventoryAdjustment;

import java.util.List;
import java.util.UUID;

public interface IInventoryAdjustmentRepository extends JpaRepository<InventoryAdjustment, UUID> {

    List<InventoryAdjustment> findByVariantIdOrderByCreatedAtDesc(UUID variantId);
}
