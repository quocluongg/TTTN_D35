package ptithcm.tttnd35backend.dto.request;

import jakarta.validation.constraints.NotBlank;

public record KnowledgeBaseVersionRequest(
        @NotBlank(message = "Tên phiên bản không được trống") String name,
        String description,
        String chunkingStrategy,
        String embeddingModel,
        Boolean isActive
) {}