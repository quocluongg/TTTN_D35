package ptithcm.tttnd35backend.dto.response;

import lombok.*;
import ptithcm.tttnd35backend.util.enums.PaymentMethod;

import java.math.BigDecimal;
import java.util.UUID;

// COD: cả 2 field null, FE hiện thông báo "đặt hàng thành công, thanh toán khi nhận hàng".
// VNPay: paymentUrl có giá trị, FE redirect sang đó.
// Stripe: clientSecret có giá trị, FE dùng Stripe.js confirmPayment().
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentInitResponse {
    private UUID orderId;
    private PaymentMethod paymentMethod;
    private BigDecimal amount;
    private String paymentUrl;
    private String clientSecret;
}
