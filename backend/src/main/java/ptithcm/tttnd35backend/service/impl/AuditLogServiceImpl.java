package ptithcm.tttnd35backend.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import ptithcm.tttnd35backend.dto.response.AuditLogResponse;
import ptithcm.tttnd35backend.dto.response.pagination.PageResponse;
import ptithcm.tttnd35backend.dto.response.pagination.PaginationMeta;
import ptithcm.tttnd35backend.entity.AuditLog;
import ptithcm.tttnd35backend.entity.Profile;
import ptithcm.tttnd35backend.mapper.IAuditLogMapper;
import ptithcm.tttnd35backend.repository.IAuditLogRepository;
import ptithcm.tttnd35backend.repository.IProfileRepository;
import ptithcm.tttnd35backend.repository.spec.AuditLogSpecifications;
import ptithcm.tttnd35backend.service.IAuditLogService;

import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class AuditLogServiceImpl implements IAuditLogService {

    private final IAuditLogRepository auditLogRepository;
    private final IProfileRepository profileRepository;
    private final IAuditLogMapper auditLogMapper;

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(UUID actorId, String action, String resourceType, String resourceId, JsonNode oldValue, JsonNode newValue, String ipAddress, String userAgent) {
        try {
            Profile actor = actorId != null ? profileRepository.findById(actorId).orElse(null) : null;
            AuditLog auditLog = AuditLog.builder()
                    .actor(actor)
                    .action(action)
                    .resourceType(resourceType)
                    .resourceId(resourceId)
                    .oldValue(oldValue)
                    .newValue(newValue)
                    .ipAddress(ipAddress)
                    .userAgent(userAgent)
                    .createdAt(LocalDateTime.now())
                    .build();
            auditLogRepository.save(auditLog);
        } catch (Exception e) {
            log.error("Failed to record audit log action={}: {}", action, e.getMessage());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AuditLogResponse> getAuditLogs(UUID actorId, String action, String resourceType, LocalDateTime from, LocalDateTime to, Pageable pageable) {
        var spec = AuditLogSpecifications.withFilter(actorId, action, resourceType, from, to);
        var page = auditLogRepository.findAll(spec, pageable);

        return PageResponse.<AuditLogResponse>builder()
                .items(auditLogMapper.toResponseList(page.getContent()))
                .pagination(PaginationMeta.builder()
                        .currentPage(page.getNumber())
                        .pageSize(page.getSize())
                        .totalPages(page.getTotalPages())
                        .totalItems(page.getTotalElements())
                        .build())
                .build();
    }
}
