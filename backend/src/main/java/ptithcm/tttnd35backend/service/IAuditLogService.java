package ptithcm.tttnd35backend.service;

import ptithcm.tttnd35backend.entity.Profile;

public interface IAuditLogService {
    void log(Profile actor, String action, String entityType, String entityId, String summary, Object oldValue, Object newValue);
}
