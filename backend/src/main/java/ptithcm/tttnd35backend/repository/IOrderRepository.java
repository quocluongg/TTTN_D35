package ptithcm.tttnd35backend.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import ptithcm.tttnd35backend.entity.Order;
import ptithcm.tttnd35backend.util.enums.OrderStatus;
import ptithcm.tttnd35backend.util.enums.PaymentMethod;
import ptithcm.tttnd35backend.util.enums.PaymentStatus;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface IOrderRepository extends JpaRepository<Order, UUID> {

    @EntityGraph(attributePaths = {"user", "address"})
    Optional<Order> findById(UUID id);

    Optional<Order> findByIdAndUserId(UUID id, UUID userId);

    @EntityGraph(attributePaths = {"user", "address"})
    Page<Order> findAllByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    @EntityGraph(attributePaths = {"user", "address"})
    @org.springframework.data.jpa.repository.Query("""
            SELECT o FROM Order o
            WHERE o.user.id = :userId
               OR (o.user IS NULL AND :email IS NOT NULL AND LOWER(o.customerEmail) = LOWER(:email))
            ORDER BY o.createdAt DESC
            """)
    Page<Order> findMyOrders(
            @org.springframework.data.repository.query.Param("userId") UUID userId,
            @org.springframework.data.repository.query.Param("email") String email,
            Pageable pageable);

    @org.springframework.data.jpa.repository.Query("""
            SELECT o FROM Order o
            WHERE o.id = :orderId
              AND (o.user.id = :userId OR (o.user IS NULL AND :email IS NOT NULL AND LOWER(o.customerEmail) = LOWER(:email)))
            """)
    Optional<Order> findMyOrderDetail(
            @org.springframework.data.repository.query.Param("orderId") UUID orderId,
            @org.springframework.data.repository.query.Param("userId") UUID userId,
            @org.springframework.data.repository.query.Param("email") String email);

    @EntityGraph(attributePaths = {"user", "address"})
    Page<Order> findAllByStatusOrderByCreatedAtDesc(OrderStatus status, Pageable pageable);

    @EntityGraph(attributePaths = {"user", "address"})
    Page<Order> findAll(Pageable pageable);

    // Quét đơn online payment (Stripe/VNPay) quá hạn chưa thanh toán -> job tự huỷ + hoàn kho/voucher.
    List<Order> findAllByPaymentMethodNotAndPaymentStatusAndStatusAndCreatedAtBefore(
            PaymentMethod excludedMethod, PaymentStatus paymentStatus, OrderStatus status, LocalDateTime before);

    @org.springframework.data.jpa.repository.Query("""
            SELECT new ptithcm.tttnd35backend.dto.response.OrderStatusSummaryResponse(o.status, COUNT(o))
            FROM Order o
            WHERE (:from IS NULL OR o.createdAt >= :from)
              AND (:to IS NULL OR o.createdAt <= :to)
            GROUP BY o.status
            """)
    List<ptithcm.tttnd35backend.dto.response.OrderStatusSummaryResponse> countOrdersByStatus(
            @org.springframework.data.repository.query.Param("from") LocalDateTime from,
            @org.springframework.data.repository.query.Param("to") LocalDateTime to);

    @org.springframework.data.jpa.repository.Query("""
            SELECT new ptithcm.tttnd35backend.dto.response.TopCustomerResponse(
                p.id, p.fullName, p.email, COUNT(o), SUM(o.totalAmount)
            )
            FROM Order o
            JOIN o.user p
            WHERE (o.status = 'COMPLETED' OR o.paymentStatus = 'PAID')
              AND o.status <> 'CANCELLED'
              AND (:from IS NULL OR o.createdAt >= :from)
              AND (:to IS NULL OR o.createdAt <= :to)
            GROUP BY p.id, p.fullName, p.email
            ORDER BY SUM(o.totalAmount) DESC
            """)
    List<ptithcm.tttnd35backend.dto.response.TopCustomerResponse> findTopCustomers(
            @org.springframework.data.repository.query.Param("from") LocalDateTime from,
            @org.springframework.data.repository.query.Param("to") LocalDateTime to,
            Pageable pageable);
}
