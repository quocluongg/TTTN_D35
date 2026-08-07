package ptithcm.tttnd35backend.dto.response;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class SystemConfigResponse {
    private String key;
    private JsonNode value;
    private String description;
    private boolean isPublic;
    private UUID updatedById;
    private String updatedByName;
    private LocalDateTime updatedAt;
}
