package ptithcm.tttnd35backend.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.List;

/** Chỉ dùng khi review đang PENDING (chưa admin duyệt) - xem ProductReviewServiceImpl#update. */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductReviewUpdateRequest {

    @NotNull(message = "Thiếu rating")
    @Min(value = 1, message = "Rating tối thiểu là 1")
    @Max(value = 5, message = "Rating tối đa là 5")
    private Integer rating;

    private String comment;

    private List<String> images;
}
