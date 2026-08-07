package ptithcm.tttnd35backend.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import ptithcm.tttnd35backend.util.enums.ReviewStatus;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewStatusRequest {

    @NotNull(message = "Thiếu trạng thái status")
    private ReviewStatus status;
}
