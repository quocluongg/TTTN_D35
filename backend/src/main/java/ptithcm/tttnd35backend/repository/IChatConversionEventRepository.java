package ptithcm.tttnd35backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import ptithcm.tttnd35backend.entity.ChatConversionEvent;

import java.time.LocalDateTime;
import java.util.UUID;

public interface IChatConversionEventRepository extends JpaRepository<ChatConversionEvent, UUID> {

    @Query("SELECT COUNT(e) FROM ChatConversionEvent e WHERE e.eventType = ptithcm.tttnd35backend.util.enums.ConversionEventType.ADD_TO_CART " +
            "AND (:from IS NULL OR e.createdAt >= :from) AND (:to IS NULL OR e.createdAt <= :to)")
    long countAddToCart(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("SELECT COUNT(e) FROM ChatConversionEvent e WHERE e.eventType = ptithcm.tttnd35backend.util.enums.ConversionEventType.ORDER_PLACED " +
            "AND (:from IS NULL OR e.createdAt >= :from) AND (:to IS NULL OR e.createdAt <= :to)")
    long countOrdersPlaced(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("SELECT COUNT(e) FROM ChatConversionEvent e WHERE e.eventType = ptithcm.tttnd35backend.util.enums.ConversionEventType.RECOMMENDED " +
            "AND (:from IS NULL OR e.createdAt >= :from) AND (:to IS NULL OR e.createdAt <= :to)")
    long countRecommended(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);
}