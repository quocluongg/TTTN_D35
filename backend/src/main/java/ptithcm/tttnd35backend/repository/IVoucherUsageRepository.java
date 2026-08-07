package ptithcm.tttnd35backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ptithcm.tttnd35backend.entity.VoucherUsage;

import java.util.Optional;
import java.util.UUID;

public interface IVoucherUsageRepository extends JpaRepository<VoucherUsage, UUID> {

    long countByVoucherIdAndProfileId(UUID voucherId, UUID profileId);

    Optional<VoucherUsage> findByOrderId(UUID orderId);

    void deleteByOrderId(UUID orderId);
}
