package ptithcm.tttnd35backend.dto.response;

import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

/** Dùng cho GET /reviews/reviewable - FE trang chi tiết sản phẩm hỏi "tôi review được sản phẩm nào". */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewableOrderItemResponse {
    private UUID orderItemId;
    private UUID productId;
    private String productName;
    private String variantName;
    private LocalDateTime purchasedAt;
}
