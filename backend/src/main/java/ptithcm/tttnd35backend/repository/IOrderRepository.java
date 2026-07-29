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
    Page<Order> findAllByStatusOrderByCreatedAtDesc(OrderStatus status, Pageable pageable);

    @EntityGraph(attributePaths = {"user", "address"})
    Page<Order> findAll(Pageable pageable);

    // Quét đơn online payment (Stripe/VNPay) quá hạn chưa thanh toán -> job tự huỷ + hoàn kho/voucher.
    List<Order> findAllByPaymentMethodNotAndPaymentStatusAndStatusAndCreatedAtBefore(
            PaymentMethod excludedMethod, PaymentStatus paymentStatus, OrderStatus status, LocalDateTime before);
}
