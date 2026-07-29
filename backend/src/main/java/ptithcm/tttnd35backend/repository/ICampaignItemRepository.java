package ptithcm.tttnd35backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import ptithcm.tttnd35backend.entity.CampaignItem;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ICampaignItemRepository extends JpaRepository<CampaignItem, UUID> {

    List<CampaignItem> findAllByCampaignId(UUID campaignId);

    Optional<CampaignItem> findByIdAndCampaignId(UUID id, UUID campaignId);

    boolean existsByCampaignIdAndVariantId(UUID campaignId, UUID variantId);

    void deleteAllByCampaignId(UUID campaignId);

    // Dùng ở Cart/Order để biết variant nào đang thật sự được sale (campaign đang active + trong thời gian
    // hiệu lực) - lọc điều kiện Campaign ngay trong query thay vì load hết rồi check ở Java, tránh N+1.
    // CampaignItem không map @ManyToOne Campaign (giống ProductVariant/ProductImage) nên join bằng theta-join.
    @Query("""
            SELECT ci FROM CampaignItem ci, Campaign c
            WHERE ci.campaignId = c.id
              AND ci.variantId IN :variantIds
              AND c.isActive = true
              AND :now BETWEEN c.startTime AND c.endTime
            """)
    List<CampaignItem> findActiveByVariantIds(@Param("variantIds") Collection<UUID> variantIds, @Param("now") LocalDateTime now);

    // Chỉ áp dụng khi stock_quantity khác null (có giới hạn suất sale riêng). Trả về 0 = hết suất.
    @Modifying(clearAutomatically = true)
    @Query("update CampaignItem c set c.stockQuantity = c.stockQuantity - :qty where c.id = :id and c.stockQuantity >= :qty")
    int decreaseStock(@Param("id") UUID id, @Param("qty") int qty);

    @Modifying(clearAutomatically = true)
    @Query("update CampaignItem c set c.stockQuantity = c.stockQuantity + :qty where c.id = :id and c.stockQuantity is not null")
    int increaseStock(@Param("id") UUID id, @Param("qty") int qty);
}
