package ptithcm.tttnd35backend.dto.response;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class AuditLogResponse {
    private UUID id;
    private UUID actorId;
    private String actorName;
    private String actorEmail;
    private String action;
    private String resourceType;
    private String resourceId;
    private JsonNode oldValue;
    private JsonNode newValue;
    private String ipAddress;
    private String userAgent;
    private LocalDateTime createdAt;
}
