package ptithcm.tttnd35backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TopCustomerResponse {
    private UUID customerId;
    private String customerName;
    private String customerEmail;
    private long totalOrders;
    private BigDecimal totalSpent;
}
