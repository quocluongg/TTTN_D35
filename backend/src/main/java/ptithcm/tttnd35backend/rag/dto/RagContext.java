package ptithcm.tttnd35backend.rag.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RagContext {
    private UUID userId;
    private String role;
    private String preferredCategory;
}
