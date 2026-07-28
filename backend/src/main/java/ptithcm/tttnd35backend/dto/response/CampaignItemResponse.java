package ptithcm.tttnd35backend.dto.response;

import lombok.*;
import ptithcm.tttnd35backend.util.enums.DiscountType;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CampaignItemResponse {
    private UUID id;
    private UUID variantId;
    private String sku;
    private String variantName;
    private String productName;

    private BigDecimal originalPrice;
    private DiscountType discountType;
    private BigDecimal discountValue;

    // Tính sẵn từ originalPrice + discountType/discountValue - FE không cần tự tính lại.
    private BigDecimal salePrice;
}
