package ptithcm.tttnd35backend.scheduler;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import ptithcm.tttnd35backend.dto.request.OrderStatusUpdateRequest;
import ptithcm.tttnd35backend.entity.Order;
import ptithcm.tttnd35backend.repository.IOrderRepository;
import ptithcm.tttnd35backend.service.IOrderService;
import ptithcm.tttnd35backend.util.enums.OrderStatus;
import ptithcm.tttnd35backend.util.enums.PaymentMethod;
import ptithcm.tttnd35backend.util.enums.PaymentStatus;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Xử lý case "bỏ ngang lúc thanh toán" (đóng tab, mất mạng, quá giờ ...) -
 * nếu không có: tồn kho + lượt voucher sẽ bị "kẹt" vô thời hạn co đơn không ai thanh toán.
 * Chỉ quét đơn online payment (Stripe/VNPay) - COD không cần
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OrderTimeoutScheduler {

    private final IOrderRepository orderRepository;
    private final IOrderService orderService;

    @Value("${service.payment.order-timeout-minutes}")
    private int timeoutMinutes;

    // Quét mỗi 5 phút - đủ nhanh để không giữ kho lâu, đủ thưa để không tốn tài nguyên DB.
    @Scheduled(fixedDelay = 5 * 60 * 1000)
    public void cancelExpiredUnpaidOrders() {
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(timeoutMinutes);
        List<Order> expired = orderRepository.findAllByPaymentMethodNotAndPaymentStatusAndStatusAndCreatedAtBefore(
                PaymentMethod.COD, PaymentStatus.PENDING, OrderStatus.PENDING, cutoff);

        for (Order order : expired) {
            try {
                // Đi qua IOrderService (không update trực tiếp) để chắc chắn dùng đúng logic hoàn kho/voucher
                // của cancelAndRollback - tránh 2 nơi tự viết 2 lần logic dễ lệch nhau.
                orderService.updateStatus(order.getId(), OrderStatusUpdateRequest.builder()
                        .status(OrderStatus.CANCELLED)
                        .build());
                log.info("Auto-cancelled order {} - quá hạn thanh toán {} phút", order.getId(), timeoutMinutes);
            } catch (Exception e) {
                // 1 đơn lỗi không được chặn các đơn còn lại trong cùng lượt quét.
                log.error("Auto-cancel order {} thất bại: {}", order.getId(), e.getMessage());
            }
        }
    }
}
