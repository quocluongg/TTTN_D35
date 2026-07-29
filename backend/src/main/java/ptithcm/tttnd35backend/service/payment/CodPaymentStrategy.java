package ptithcm.tttnd35backend.service.payment;

import org.springframework.stereotype.Component;
import ptithcm.tttnd35backend.dto.response.PaymentInitResponse;
import ptithcm.tttnd35backend.entity.Order;
import ptithcm.tttnd35backend.entity.PaymentTransaction;
import ptithcm.tttnd35backend.util.enums.PaymentMethod;

// COD không cần gọi cổng nào - tiền thu khi giao hàng, PaymentTransaction giữ nguyên PENDING
// cho tới khi OrderServiceImpl.updateStatus chuyển đơn sang COMPLETED (xem đoạn set PAID ở đó).
@Component
public class CodPaymentStrategy implements IPaymentStrategy {

    @Override
    public PaymentMethod getMethod() {
        return PaymentMethod.COD;
    }

    @Override
    public PaymentInitResponse init(Order order, PaymentTransaction transaction) {
        return PaymentInitResponse.builder()
                .orderId(order.getId())
                .paymentMethod(PaymentMethod.COD)
                .amount(order.getTotalAmount())
                .build();
    }
}
