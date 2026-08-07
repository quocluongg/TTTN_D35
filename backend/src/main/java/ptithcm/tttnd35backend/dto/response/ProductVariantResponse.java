package ptithcm.tttnd35backend.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductVariantResponse {
    private UUID id;
    private String sku;
    private String variantName;
    private BigDecimal price;
    private int stock;
    private Map<String, String> attributes;
    private BigDecimal vatPercent;
    private String image;
    private boolean isActive;
}
