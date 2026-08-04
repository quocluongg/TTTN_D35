package ptithcm.tttnd35backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ptithcm.tttnd35backend.entity.OrderItem;

import java.util.List;
import java.util.UUID;

public interface IOrderItemRepository extends JpaRepository<OrderItem, UUID> {

    List<OrderItem> findAllByOrderId(UUID orderId);

    List<OrderItem> findAllByOrderIdIn(List<UUID> orderIds);

    @org.springframework.data.jpa.repository.Query("""
            SELECT new ptithcm.tttnd35backend.dto.response.TopProductResponse(
                p.id, p.name, p.thumbnail, SUM(oi.quantity), SUM(oi.priceAtPurchase * oi.quantity)
            )
            FROM OrderItem oi
            JOIN Order o ON oi.orderId = o.id
            JOIN Product p ON oi.productId = p.id
            WHERE (o.status = 'COMPLETED' OR o.paymentStatus = 'PAID')
              AND o.status <> 'CANCELLED'
              AND (:from IS NULL OR o.createdAt >= :from)
              AND (:to IS NULL OR o.createdAt <= :to)
            GROUP BY p.id, p.name, p.thumbnail
            ORDER BY SUM(oi.quantity) DESC
            """)
    List<ptithcm.tttnd35backend.dto.response.TopProductResponse> findTopProducts(
            @org.springframework.data.repository.query.Param("from") java.time.LocalDateTime from,
            @org.springframework.data.repository.query.Param("to") java.time.LocalDateTime to,
            org.springframework.data.domain.Pageable pageable);
}
