package ptithcm.tttnd35backend.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ChatKbEffectivenessResponse {
    private String versionName;
    private long conversations;
    private long messages;
    private double avgConfidence;
    private long flaggedCount;
    private double flaggedRate;
    private long ordersPlaced;
    private double conversionRate;
}