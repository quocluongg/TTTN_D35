package ptithcm.tttnd35backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import ptithcm.tttnd35backend.entity.WarrantyCard;
import ptithcm.tttnd35backend.util.enums.WarrantyStatus;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface IWarrantyCardRepository extends JpaRepository<WarrantyCard, UUID>, JpaSpecificationExecutor<WarrantyCard> {

    Optional<WarrantyCard> findByCustomerPhoneAndSerialNumber(String customerPhone, String serialNumber);

    Optional<WarrantyCard> findBySerialNumber(String serialNumber);

    boolean existsByOrderItemId(UUID orderItemId);

    boolean existsBySerialNumber(String serialNumber);

    List<WarrantyCard> findByStatusAndExpiryDateBefore(WarrantyStatus status, LocalDate today);

    @Modifying
    @Query("UPDATE WarrantyCard w SET w.status = 'EXPIRED' WHERE w.status = 'ACTIVE' AND w.expiryDate < :today")
    int updateExpiredCards(@Param("today") LocalDate today);
}
