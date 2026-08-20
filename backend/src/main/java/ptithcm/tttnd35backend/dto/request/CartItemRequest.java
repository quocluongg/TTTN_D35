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
public class CartItemRequest {

    @NotNull(message = "Vui lòng chọn biến thể sản phẩm")
    private UUID variantId;

    @NotNull(message = "Số lượng không được để trống")
    @Min(value = 1, message = "Số lượng phải >= 1")
    private Integer quantity;

    // Nguồn thêm vào giỏ: CHATBOT (từ gợi ý bot) hoặc BROWSE (duyệt web). Mặc định BROWSE.
    @Builder.Default
    private CartSource source = CartSource.BROWSE;

    // Chỉ khi source = CHATBOT: id hội thoại bot đã gợi ý sản phẩm này.
    private UUID conversationId;
}
