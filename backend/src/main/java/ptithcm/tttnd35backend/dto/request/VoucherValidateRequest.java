package ptithcm.tttnd35backend.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VoucherValidateRequest {

    @NotBlank(message = "Vui lòng nhập mã voucher")
    private String code;

    // Tổng tiền các sản phẩm ĐANG KHÔNG sale (không nằm trong campaign_items đang active) - vì
    // voucher không áp lên sản phẩm đang sale. Order (giai đoạn 5) sẽ tự tính con số này khi checkout.
    @NotNull(message = "Số tiền đơn hàng không được để trống")
    @DecimalMin(value = "0", message = "Số tiền đơn hàng phải >= 0")
    private BigDecimal eligibleAmount;
}
