package ptithcm.tttnd35backend.rag.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RagFeedbackRequest {
    @NotNull(message = "messageId không được để trống")
    private UUID messageId;

    @NotNull(message = "rating không được để trống (1 hoặc -1)")
    private Integer rating;

    private String note;
}
