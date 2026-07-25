package ptithcm.tttnd35backend.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ptithcm.tttnd35backend.entity.AuditLog;
import ptithcm.tttnd35backend.entity.Profile;
import ptithcm.tttnd35backend.repository.IAuditLogRepository;
import ptithcm.tttnd35backend.service.IAuditLogService;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditLogServiceImpl implements IAuditLogService {

    private final IAuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    @SneakyThrows
    public void log(Profile actor, String action, String entityType, String entityId, String summary, Object oldValue, Object newValue) {
        String oldJson = oldValue != null ? objectMapper.writeValueAsString(oldValue) : null;
        String newJson = newValue != null ? objectMapper.writeValueAsString(newValue) : null;

        AuditLog audit = AuditLog.builder()
                .actor(actor)
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .summary(summary)
                .oldValue(oldJson)
                .newValue(newJson)
                .build();

        auditLogRepository.save(audit);
    }
}
