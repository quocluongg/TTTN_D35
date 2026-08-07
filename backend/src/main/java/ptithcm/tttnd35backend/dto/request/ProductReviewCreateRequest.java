package ptithcm.tttnd35backend.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductReviewCreateRequest {

    @NotNull(message = "Thiếu orderItemId")
    private UUID orderItemId;

    @NotNull(message = "Thiếu rating")
    @Min(value = 1, message = "Rating tối thiểu là 1")
    @Max(value = 5, message = "Rating tối đa là 5")
    private Integer rating;

    private String comment;

    private List<String> images;
}
