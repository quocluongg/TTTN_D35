package ptithcm.tttnd35backend.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class KnowledgeBaseVersionResponse {
    private UUID id;
    private String name;
    private String description;
    private String chunkingStrategy;
    private String embeddingModel;
    private boolean isActive;
    private LocalDateTime createdAt;
}