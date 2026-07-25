package ptithcm.tttnd35backend.rag.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RagQueryRequest {
    @NotBlank(message = "Nội dung tin nhắn không được để trống")
    private String message;

    private UUID conversationId;
}
