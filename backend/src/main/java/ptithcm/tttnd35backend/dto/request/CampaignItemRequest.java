package ptithcm.tttnd35backend.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import ptithcm.tttnd35backend.util.enums.DiscountType;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CampaignItemRequest {

    @NotNull(message = "Vui lòng chọn biến thể sản phẩm")
    private UUID variantId;

    @NotNull(message = "Vui lòng chọn kiểu giảm giá")
    private DiscountType discountType;

    @NotNull(message = "Giá trị giảm không được để trống")
    @DecimalMin(value = "0", message = "Giá trị giảm phải >= 0")
    private BigDecimal discountValue;

    // Null = không giới hạn số suất sale riêng.
    @Min(value = 0, message = "Số suất sale phải >= 0")
    private Integer stockQuantity;
}
