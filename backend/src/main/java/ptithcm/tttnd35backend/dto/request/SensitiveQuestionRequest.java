package ptithcm.tttnd35backend.dto.request;

import jakarta.validation.constraints.NotBlank;

public record SensitiveQuestionRequest(
        @NotBlank(message = "Pattern không được trống") String pattern,
        String category,
        Boolean isActive
) {}