package ptithcm.tttnd35backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

/**
 * JPA Auditing để BaseEntity.createdAt/updatedAt tự set giá trị,
 */
@Configuration
@EnableJpaAuditing
public class JpaAuditingConfig {
}
