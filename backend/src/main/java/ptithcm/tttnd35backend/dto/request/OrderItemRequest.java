package ptithcm.tttnd35backend.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import ptithcm.tttnd35backend.util.enums.CartSource;

import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderItemRequest {

    @NotNull(message = "Vui lòng chọn sản phẩm")
    private UUID variantId;

    @NotNull(message = "Vui lòng nhập số lượng")
    @Min(value = 1, message = "Số lượng phải >= 1")
    private Integer quantity;

    // Nguồn dòng đơn (CHATBOT/BROWSE) - copy từ cart item khi checkout để tính doanh thu theo nguồn.
    private CartSource source;
}
