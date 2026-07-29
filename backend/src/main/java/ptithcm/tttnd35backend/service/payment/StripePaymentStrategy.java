package ptithcm.tttnd35backend.service.payment;

import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import com.stripe.net.RequestOptions;
import com.stripe.param.PaymentIntentCreateParams;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import ptithcm.tttnd35backend.dto.response.PaymentInitResponse;
import ptithcm.tttnd35backend.entity.Order;
import ptithcm.tttnd35backend.entity.PaymentTransaction;
import ptithcm.tttnd35backend.exception.BadRequestException;
import ptithcm.tttnd35backend.util.enums.PaymentMethod;

import java.math.RoundingMode;

/**
 * Test key lấy ở https://dashboard.stripe.com/test/apikeys - không cần tài khoản thật, không cần
 * thẻ thật. Test thanh toán bằng thẻ mẫu Stripe: số thẻ 4242 4242 4242 4242, ngày hết hạn bất kỳ
 * trong tương lai, CVC bất kỳ 3 số.
 */
@Component
public class StripePaymentStrategy implements IPaymentStrategy {

    @Value("${service.payment.stripe.secret-key}")
    private String secretKey;

    @Override
    public PaymentMethod getMethod() {
        return PaymentMethod.STRIPE;
    }

    @Override
    public PaymentInitResponse init(Order order, PaymentTransaction transaction) {
        // VND là zero-decimal currency ở Stripe - KHÔNG nhân 100 như USD.
        long amount = order.getTotalAmount().setScale(0, RoundingMode.HALF_UP).longValueExact();

        PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                .setAmount(amount)
                .setCurrency("vnd")
                .putMetadata("orderId", order.getId().toString())
                .putMetadata("transactionId", transaction.getId().toString())
                // Bắt buộc nếu FE dùng Stripe Elements hiện đại (Payment Element) - không set cái này
                // thì <PaymentElement> phía FE sẽ không render được phương thức thanh toán nào cả.
                .setAutomaticPaymentMethods(
                        PaymentIntentCreateParams.AutomaticPaymentMethods.builder()
                                .setEnabled(true)
                                .build())
                .build();

        // idempotencyKey = transaction.id -> gọi lại (retry mạng) không tạo PaymentIntent trùng.
        RequestOptions options = RequestOptions.builder()
                .setApiKey(secretKey)
                .setIdempotencyKey(transaction.getId().toString())
                .build();

        try {
            PaymentIntent intent = PaymentIntent.create(params, options);
            return PaymentInitResponse.builder()
                    .orderId(order.getId())
                    .paymentMethod(PaymentMethod.STRIPE)
                    .amount(order.getTotalAmount())
                    .clientSecret(intent.getClientSecret())
                    .build();
        } catch (StripeException e) {
            throw new BadRequestException("Không khởi tạo được giao dịch Stripe: " + e.getMessage());
        }
    }
}
