package ptithcm.tttnd35backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.data.domain.Pageable;
import ptithcm.tttnd35backend.dto.response.AuditLogResponse;
import ptithcm.tttnd35backend.dto.response.pagination.PageResponse;

import java.time.LocalDateTime;
import java.util.UUID;

public interface IAuditLogService {

    void log(UUID actorId, String action, String resourceType, String resourceId, JsonNode oldValue, JsonNode newValue, String ipAddress, String userAgent);

    PageResponse<AuditLogResponse> getAuditLogs(UUID actorId, String action, String resourceType, LocalDateTime from, LocalDateTime to, Pageable pageable);
}
