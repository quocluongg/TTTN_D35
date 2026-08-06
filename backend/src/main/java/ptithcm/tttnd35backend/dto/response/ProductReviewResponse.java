package ptithcm.tttnd35backend.dto.response;

import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/** Dùng cho GET /products/{productId}/reviews (public, chỉ trả review APPROVED) - ẩn status. */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductReviewResponse {
    private UUID id;
    private UUID productId;
    private String reviewerName;
    private int rating;
    private String comment;

    @Builder.Default
    private List<String> images = new ArrayList<>();

    private LocalDateTime createdAt;
}
