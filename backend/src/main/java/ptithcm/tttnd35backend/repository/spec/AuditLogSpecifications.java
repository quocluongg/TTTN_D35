package ptithcm.tttnd35backend.repository.spec;

import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;
import ptithcm.tttnd35backend.entity.AuditLog;

import java.time.LocalDateTime;
import java.util.UUID;

public class AuditLogSpecifications {

    public static Specification<AuditLog> withFilter(
            UUID actorId,
            String action,
            String resourceType,
            LocalDateTime from,
            LocalDateTime to
    ) {
        return (root, query, cb) -> {
            var predicate = cb.conjunction();

            if (actorId != null) {
                predicate = cb.and(predicate, cb.equal(root.get("actor").get("id"), actorId));
            }

            if (StringUtils.hasText(action)) {
                predicate = cb.and(predicate, cb.equal(root.get("action"), action));
            }

            if (StringUtils.hasText(resourceType)) {
                predicate = cb.and(predicate, cb.equal(root.get("resourceType"), resourceType));
            }

            if (from != null) {
                predicate = cb.and(predicate, cb.greaterThanOrEqualTo(root.get("createdAt"), from));
            }

            if (to != null) {
                predicate = cb.and(predicate, cb.lessThanOrEqualTo(root.get("createdAt"), to));
            }

            return predicate;
        };
    }
}
