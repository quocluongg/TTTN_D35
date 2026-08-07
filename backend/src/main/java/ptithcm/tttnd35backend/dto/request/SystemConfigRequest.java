package ptithcm.tttnd35backend.dto.request;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotNull;

public record SystemConfigRequest(
        @NotNull(message = "Giá trị value không được để trống")
        JsonNode value,

        String description,
        Boolean isPublic
) {}
