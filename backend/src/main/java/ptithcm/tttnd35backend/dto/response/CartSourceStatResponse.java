package ptithcm.tttnd35backend.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CartSourceStatResponse {
    private String source;
    private long addToCart;
    private long ordersPlaced;
    private double conversionRate;
    private double revenue;
}
