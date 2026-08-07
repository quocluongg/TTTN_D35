package ptithcm.tttnd35backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import ptithcm.tttnd35backend.util.enums.OrderStatus;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderStatusSummaryResponse {
    private OrderStatus status;
    private long count;
}
