package ptithcm.tttnd35backend.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ChatSourceComparisonResponse {
    private String source;
    private long conversations;
    private long uniqueUsers;
    private long addToCart;
    private long ordersPlaced;
    private double addToCartRate;
    private double conversionRate;
    private double revenue;
}