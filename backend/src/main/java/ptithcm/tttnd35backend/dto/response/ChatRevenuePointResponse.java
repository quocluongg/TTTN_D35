package ptithcm.tttnd35backend.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ChatRevenuePointResponse {
    private String period;
    private long orders;
    private double revenue;
}