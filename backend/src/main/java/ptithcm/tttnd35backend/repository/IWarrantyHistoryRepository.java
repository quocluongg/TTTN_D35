package ptithcm.tttnd35backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ptithcm.tttnd35backend.entity.WarrantyHistory;

import java.util.List;
import java.util.UUID;

public interface IWarrantyHistoryRepository extends JpaRepository<WarrantyHistory, UUID> {

    List<WarrantyHistory> findByWarrantyCardIdOrderByRequestDateDesc(UUID warrantyCardId);
}
