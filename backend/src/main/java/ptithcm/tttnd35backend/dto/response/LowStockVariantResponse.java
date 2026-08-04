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
public class LowStockVariantResponse {
    private UUID variantId;
    private String variantName;
    private String sku;
    private UUID productId;
    private String productName;
    private int stockQuantity;
    private BigDecimal price;
}
