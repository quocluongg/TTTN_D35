package ptithcm.tttnd35backend.service.impl;

import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
import com.stripe.model.PaymentIntent;
import com.stripe.net.Webhook;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ptithcm.tttnd35backend.dto.response.PaymentInitResponse;
import ptithcm.tttnd35backend.entity.Order;
import ptithcm.tttnd35backend.entity.PaymentTransaction;
import ptithcm.tttnd35backend.exception.BadRequestException;
import ptithcm.tttnd35backend.exception.ResourceNotFoundException;
import ptithcm.tttnd35backend.repository.IOrderRepository;
import ptithcm.tttnd35backend.repository.IPaymentTransactionRepository;
import ptithcm.tttnd35backend.service.IPaymentService;
import ptithcm.tttnd35backend.service.payment.IPaymentStrategy;
import ptithcm.tttnd35backend.util.enums.OrderStatus;
import ptithcm.tttnd35backend.util.enums.PaymentMethod;
import ptithcm.tttnd35backend.util.enums.PaymentStatus;
import ptithcm.tttnd35backend.util.enums.PaymentTxnStatus;
import ptithcm.tttnd35backend.util.helper.VnpayUtil;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements IPaymentService {

    private final IOrderRepository orderRepository;
    private final IPaymentTransactionRepository paymentTransactionRepository;
    private final List<IPaymentStrategy> strategies;

    @Value("${service.payment.vnpay.hash-secret}")
    private String vnpayHashSecret;

    @Value("${service.payment.stripe.webhook-secret}")
    private String stripeWebhookSecret;

    private Map<PaymentMethod, IPaymentStrategy> strategyByMethod;

    private Map<PaymentMethod, IPaymentStrategy> strategies() {
        if (strategyByMethod == null) {
            strategyByMethod = strategies.stream()
                    .collect(Collectors.toMap(IPaymentStrategy::getMethod, s -> s));
        }
        return strategyByMethod;
    }

    @Override
    @Transactional
    public PaymentInitResponse initPayment(UUID orderId, UUID profileId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng"));

        // Nếu đơn có chủ (order.getUser() != null) thì BẮT BUỘC profileId phải khớp - kể cả khi
        // profileId là null (gọi ẩn danh, không kèm token). Bug cũ: thêm điều kiện "profileId != null"
        // vào đây vô tình cho phép AI ĐÓ gọi ẩn danh (không token) là né được check, lấy được
        // clientSecret/paymentUrl của đơn người khác nếu biết orderId. Chỉ đơn guest thật
        // (order.getUser() == null) mới được phép init mà không cần profileId khớp.
        if (order.getUser() != null && !order.getUser().getId().equals(profileId)) {
            throw new ResourceNotFoundException("Không tìm thấy đơn hàng");
        }
        if (order.getPaymentStatus() == PaymentStatus.PAID) {
            throw new BadRequestException("Đơn hàng đã được thanh toán");
        }
        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new BadRequestException("Đơn hàng đã bị huỷ");
        }

        PaymentTransaction transaction = paymentTransactionRepository.findTopByOrderIdOrderByCreatedAtDesc(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy giao dịch thanh toán cho đơn này"));

        IPaymentStrategy strategy = strategies().get(order.getPaymentMethod());
        if (strategy == null) {
            throw new BadRequestException("Phương thức thanh toán không được hỗ trợ");
        }
        return strategy.init(order, transaction);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> handleVnpayReturn(Map<String, String> params) {
        boolean validSignature = VnpayUtil.verifySignature(params, vnpayHashSecret);
        String responseCode = params.get("vnp_ResponseCode");
        return Map.of(
                "valid", validSignature,
                "orderId", params.getOrDefault("vnp_TxnRef", ""),
                "success", validSignature && "00".equals(responseCode));
    }

    @Override
    @Transactional
    public Map<String, String> handleVnpayIpn(Map<String, String> params) {
        if (!VnpayUtil.verifySignature(params, vnpayHashSecret)) {
            return Map.of("RspCode", "97", "Message", "Invalid signature");
        }

        UUID transactionId;
        try {
            transactionId = UUID.fromString(params.get("vnp_TxnRef"));
        } catch (Exception e) {
            return Map.of("RspCode", "01", "Message", "Order not found");
        }

        PaymentTransaction transaction = paymentTransactionRepository.findById(transactionId).orElse(null);
        if (transaction == null) {
            return Map.of("RspCode", "01", "Message", "Order not found");
        }

        // Idempotency - VNPay có thể gọi IPN lại nhiều lần cho cùng 1 giao dịch (mất mạng, timeout phía họ).
        if (transaction.getStatus() == PaymentTxnStatus.SUCCESS) {
            return Map.of("RspCode", "02", "Message", "Order already confirmed");
        }

        BigDecimal expectedAmount = transaction.getAmount().multiply(BigDecimal.valueOf(100));
        BigDecimal receivedAmount = new BigDecimal(params.getOrDefault("vnp_Amount", "0"));
        if (expectedAmount.compareTo(receivedAmount) != 0) {
            return Map.of("RspCode", "04", "Message", "Invalid amount");
        }

        Order order = orderRepository.findById(transaction.getOrderId()).orElse(null);
        if (order == null) {
            return Map.of("RspCode", "01", "Message", "Order not found");
        }

        boolean success = "00".equals(params.get("vnp_ResponseCode")) && "00".equals(params.get("vnp_TransactionStatus"));
        if (success) {
            transaction.setStatus(PaymentTxnStatus.SUCCESS);
            transaction.setProviderTransactionId(params.get("vnp_TransactionNo"));
            transaction.setPaidAt(LocalDateTime.now());
            transaction.setRawPayload(params.toString());
            paymentTransactionRepository.save(transaction);

            if (order.getStatus() == OrderStatus.CANCELLED) {
                // Đơn đã bị OrderTimeoutScheduler huỷ + hoàn kho trước khi IPN này tới (khách thanh toán
                // trễ/mạng chậm). KHÔNG set PAID + KHÔNG tự ý un-cancel/trừ kho lại (hàng có thể đã bán
                // cho khách khác) - chỉ log để admin biết mà đối soát/hoàn tiền thủ công qua cổng VNPay.
                log.warn("VNPay IPN success đến TRỄ cho order {} đã bị huỷ trước đó (payment transaction {}) "
                                + "- cần admin đối soát hoàn tiền thủ công qua VNPay merchant portal.",
                        order.getId(), transaction.getId());
                return Map.of("RspCode", "00", "Message", "Confirm Success");
            }

            order.setPaymentStatus(PaymentStatus.PAID);
            orderRepository.save(order);
        } else {
            transaction.setStatus(PaymentTxnStatus.FAILED);
            transaction.setRawPayload(params.toString());
            paymentTransactionRepository.save(transaction);
            // Không huỷ đơn/hoàn kho ngay - để khách thử thanh toán lại. Job quét quá hạn (OrderTimeoutScheduler)
            // sẽ tự huỷ + hoàn kho nếu vẫn PENDING sau ORDER_PAYMENT_TIMEOUT_MINUTES.
        }

        // VNPay chỉ cần biết server đã NHẬN và XỬ LÝ IPN thành công - luôn trả 00 dù thanh toán success hay failed,
        // nếu không họ sẽ coi là lỗi và gọi lại IPN liên tục.
        return Map.of("RspCode", "00", "Message", "Confirm Success");
    }

    @Override
    @Transactional
    public void handleStripeWebhook(String payload, String signatureHeader) {
        Event event;
        try {
            event = Webhook.constructEvent(payload, signatureHeader, stripeWebhookSecret);
        } catch (SignatureVerificationException e) {
            throw new BadRequestException("Chữ ký webhook Stripe không hợp lệ");
        }

        if (!"payment_intent.succeeded".equals(event.getType())
                && !"payment_intent.payment_failed".equals(event.getType())) {
            return; // Bỏ qua các event không liên quan.
        }

        PaymentIntent intent = (PaymentIntent) event.getDataObjectDeserializer().getObject().orElse(null);
        if (intent == null || intent.getMetadata() == null) {
            return;
        }
        String transactionIdStr = intent.getMetadata().get("transactionId");
        if (transactionIdStr == null) {
            return;
        }

        PaymentTransaction transaction = paymentTransactionRepository.findById(UUID.fromString(transactionIdStr)).orElse(null);
        if (transaction == null) {
            return;
        }
        // Idempotency - Stripe retry webhook nếu server không trả 200 kịp thời (vd mạng chậm) hoặc gọi lại thủ công.
        if (transaction.getStatus() == PaymentTxnStatus.SUCCESS) {
            return;
        }

        long expectedAmount = transaction.getAmount().longValueExact();
        if (intent.getAmount() != expectedAmount) {
            transaction.setStatus(PaymentTxnStatus.FAILED);
            transaction.setRawPayload("amount mismatch: expected=" + expectedAmount + " received=" + intent.getAmount());
            paymentTransactionRepository.save(transaction);
            return;
        }

        Order order = orderRepository.findById(transaction.getOrderId()).orElse(null);
        if (order == null) {
            return;
        }

        if ("payment_intent.succeeded".equals(event.getType())) {
            transaction.setStatus(PaymentTxnStatus.SUCCESS);
            transaction.setProviderTransactionId(intent.getId());
            transaction.setPaidAt(LocalDateTime.now());
            paymentTransactionRepository.save(transaction);

            if (order.getStatus() == OrderStatus.CANCELLED) {
                // Tương tự VNPay: webhook Stripe đến trễ sau khi OrderTimeoutScheduler đã huỷ + hoàn kho.
                // Không tự ý un-cancel/PAID - chỉ log để admin đối soát hoàn tiền thủ công qua Stripe Dashboard.
                log.warn("Stripe webhook succeeded đến TRỄ cho order {} đã bị huỷ trước đó (payment transaction {}) "
                                + "- cần admin đối soát hoàn tiền thủ công qua Stripe Dashboard.",
                        order.getId(), transaction.getId());
                return;
            }

            order.setPaymentStatus(PaymentStatus.PAID);
            orderRepository.save(order);
        } else {
            transaction.setStatus(PaymentTxnStatus.FAILED);
            transaction.setProviderTransactionId(intent.getId());
            paymentTransactionRepository.save(transaction);
            // Không huỷ đơn ngay - cho khách thử lại, job timeout sẽ tự dọn nếu bỏ luôn không thanh toán nữa.
        }
    }
}
