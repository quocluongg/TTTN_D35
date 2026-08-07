package ptithcm.tttnd35backend.dto.response;

import lombok.*;
import ptithcm.tttnd35backend.util.enums.ReviewStatus;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/** Dùng cho GET /admin/reviews (bảng quản lý) - thêm reviewerEmail/productName/status so với response public. */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductReviewAdminResponse {
    private UUID id;
    private UUID productId;
    private String productName;
    private String reviewerName;
    private String reviewerEmail;
    private int rating;
    private String comment;

    @Builder.Default
    private List<String> images = new ArrayList<>();

    private ReviewStatus status;
    private LocalDateTime createdAt;
}
