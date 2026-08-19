package ptithcm.tttnd35backend.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ChatStatPointResponse {
    private String period;
    private long conversations;
    private long uniqueUsers;
    private double avgDurationSeconds;
    private long messages;
    private long addToCartCount;
    private long orderPlacedCount;
    private double conversionRate;
}