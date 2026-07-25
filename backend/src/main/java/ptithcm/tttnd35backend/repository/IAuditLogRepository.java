package ptithcm.tttnd35backend.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import ptithcm.tttnd35backend.entity.AuditLog;
import java.time.LocalDateTime;
import java.util.UUID;

public interface IAuditLogRepository extends JpaRepository<AuditLog, UUID> {
    Page<AuditLog> findByCreatedAtBetween(LocalDateTime from, LocalDateTime to, Pageable pageable);
}
