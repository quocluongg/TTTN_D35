package ptithcm.tttnd35backend.dto.request;

import jakarta.validation.constraints.NotBlank;

public record TakeoverRequest(
        @NotBlank(message = "Tin nhắn không được trống") String message
) {}