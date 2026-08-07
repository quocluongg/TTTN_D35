package ptithcm.tttnd35backend.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.Map;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductVariantAdminRequest {

    // Cặp thuộc tính hiển thị lựa chọn (vd {"color":"Đen","storage":"256GB"}). Rỗng nếu sản phẩm
    // không có tùy chọn (phụ kiện đơn giản) - BE vẫn tạo đúng 1 variant cho trường hợp này.
    @Builder.Default
    private Map<String, String> attributes = new LinkedHashMap<>();

    @NotNull(message = "Giá không được để trống")
    @DecimalMin(value = "0", inclusive = true, message = "Giá phải >= 0")
    private BigDecimal price;

    @NotNull(message = "Tồn kho không được để trống")
    @Min(value = 0, message = "Tồn kho phải >= 0")
    private Integer stock;

    @Builder.Default
    @DecimalMin(value = "0", inclusive = true, message = "VAT phải >= 0")
    private BigDecimal vatPercent = BigDecimal.ZERO;

    // Ảnh riêng theo variant (vd theo màu), nullable - override thumbnail khi chọn variant này.
    private String image;
}
