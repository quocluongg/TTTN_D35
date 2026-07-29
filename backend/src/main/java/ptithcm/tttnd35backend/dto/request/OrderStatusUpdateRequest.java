package ptithcm.tttnd35backend.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import ptithcm.tttnd35backend.util.enums.OrderStatus;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderStatusUpdateRequest {

    @NotNull(message = "Vui lòng chọn trạng thái")
    private OrderStatus status;

    // Chỉ cần khi chuyển sang SHIPPED.
    private String trackingNumber;
}
