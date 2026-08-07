package ptithcm.tttnd35backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import ptithcm.tttnd35backend.entity.Voucher;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface IVoucherRepository extends JpaRepository<Voucher, UUID> {

    Optional<Voucher> findByCodeIgnoreCase(String code);

    boolean existsByCodeIgnoreCase(String code);

    boolean existsByCodeIgnoreCaseAndIdNot(String code, UUID id);

    List<Voucher> findAllByOrderByCreatedAtDesc();

    // Điều kiện maxUsage null/chưa đạt nằm ngay trong UPDATE - atomic, chống 2 đơn cùng giành lượt dùng cuối.
    // Trả về 0 = voucher vừa hết lượt (do request khác giành mất) - Service phải rollback transaction.
    @Modifying(clearAutomatically = true)
    @Query("update Voucher v set v.usedCount = v.usedCount + 1 " +
            "where v.id = :id and (v.maxUsage is null or v.usedCount < v.maxUsage)")
    int incrementUsedCount(@Param("id") UUID id);

    // Hoàn lượt dùng khi huỷ đơn/thanh toán thất bại/hết hạn thanh toán.
    @Modifying(clearAutomatically = true)
    @Query("update Voucher v set v.usedCount = v.usedCount - 1 where v.id = :id and v.usedCount > 0")
    int decrementUsedCount(@Param("id") UUID id);
}
