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
public class CartItemResponse {
    private UUID id;

    private UUID productId;
    private String productName;
    private String productSlug;

    private UUID variantId;
    private String variantName;
    private Map<String, String> attributes;
    // Ảnh riêng của variant nếu có, không thì FE tự fallback qua Product.thumbnail ở trang shop.
    private String image;

    private BigDecimal price;
    // Null = không đang sale, dùng price. Có giá trị = giá sau khuyến mãi campaign, subtotal tính theo giá này.
    private BigDecimal salePrice;
    private BigDecimal vatPercent;
    private Integer quantity;
    private BigDecimal subtotal;

    // Tồn kho hiện tại của variant - FE dùng để cảnh báo "chỉ còn X" nếu quantity đang giữ > stock hiện tại
    // (giá/tồn kho có thể đổi sau khi khách đã thêm vào giỏ).
    private Integer availableStock;
}
