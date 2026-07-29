package ptithcm.tttnd35backend.dto.response;

import lombok.*;
import ptithcm.tttnd35backend.util.enums.OrderStatus;
import ptithcm.tttnd35backend.util.enums.PaymentMethod;
import ptithcm.tttnd35backend.util.enums.PaymentStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderResponse {
    private UUID id;
    private String customerName;
    private String customerEmail;
    private String customerPhone;
    private String shippingAddress;

    private String voucherCode;
    private BigDecimal discountAmount;
    private BigDecimal totalAmount;

    private OrderStatus status;
    private PaymentMethod paymentMethod;
    private PaymentStatus paymentStatus;
    private String trackingNumber;

    private List<OrderItemResponse> items;
    private LocalDateTime createdAt;
}
