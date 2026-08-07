package ptithcm.tttnd35backend.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

/** Dùng cho GET /products (trang danh sách/shop) - KHÔNG kèm variants/images đầy đủ để nhẹ payload. */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductListItemResponse {
    private UUID id;
    private String slug;
    private String name;
    private String thumbnail;
    private String brand;
    private String categoryName;

    // Giá variant thấp nhất, hiển thị kiểu "Từ 12.990.000đ".
    private BigDecimal priceFrom;

    private BigDecimal ratingAvg;
    private int reviewCount;
    private boolean isActive;
    private int soldQuantity;
    private String useCase;
}
