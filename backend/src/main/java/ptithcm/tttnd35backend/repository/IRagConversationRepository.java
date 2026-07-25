package ptithcm.tttnd35backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ptithcm.tttnd35backend.entity.RagConversation;

import java.util.List;
import java.util.UUID;

@Repository
public interface IRagConversationRepository extends JpaRepository<RagConversation, UUID> {
    List<RagConversation> findByUserIdOrderByStartedAtDesc(UUID userId);
}
