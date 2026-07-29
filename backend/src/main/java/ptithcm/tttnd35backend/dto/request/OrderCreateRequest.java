package ptithcm.tttnd35backend.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import ptithcm.tttnd35backend.util.enums.PaymentMethod;

import java.util.List;
import java.util.UUID;

// Checkout từ Cart - bắt buộc đăng nhập (đã có Address trong sổ địa chỉ).
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderCreateRequest {

    @NotNull(message = "Vui lòng chọn địa chỉ giao hàng")
    private UUID addressId;

    // Null/rỗng = checkout toàn bộ giỏ hàng. Có giá trị = chỉ checkout các variant được chọn.
    private List<UUID> variantIds;

    private String voucherCode;

    @NotNull(message = "Vui lòng chọn phương thức thanh toán")
    private PaymentMethod paymentMethod;
}
