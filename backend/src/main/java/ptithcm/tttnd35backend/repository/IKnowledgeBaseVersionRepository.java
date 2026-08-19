package ptithcm.tttnd35backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import ptithcm.tttnd35backend.entity.KnowledgeBaseVersion;

import java.util.Optional;
import java.util.UUID;

public interface IKnowledgeBaseVersionRepository extends JpaRepository<KnowledgeBaseVersion, UUID>, JpaSpecificationExecutor<KnowledgeBaseVersion> {
    Optional<KnowledgeBaseVersion> findFirstByIsActiveTrue();
    boolean existsByName(String name);
}