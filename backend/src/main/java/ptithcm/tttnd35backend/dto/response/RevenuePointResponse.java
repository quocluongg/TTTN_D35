package ptithcm.tttnd35backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RevenuePointResponse {
    private String period;
    private BigDecimal totalAmount;
    private long orderCount;
}
