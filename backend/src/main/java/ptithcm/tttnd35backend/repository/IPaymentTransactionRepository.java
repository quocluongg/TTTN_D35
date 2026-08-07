package ptithcm.tttnd35backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ptithcm.tttnd35backend.entity.PaymentTransaction;
import ptithcm.tttnd35backend.util.enums.PaymentMethod;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface IPaymentTransactionRepository extends JpaRepository<PaymentTransaction, UUID> {

    List<PaymentTransaction> findAllByOrderIdOrderByCreatedAtDesc(UUID orderId);

    Optional<PaymentTransaction> findTopByOrderIdOrderByCreatedAtDesc(UUID orderId);

    // Dedup webhook: VNPay IPN / Stripe webhook có thể gọi lại nhiều lần cho cùng 1 giao dịch.
    Optional<PaymentTransaction> findByProviderAndProviderTransactionId(PaymentMethod provider, String providerTransactionId);
}
