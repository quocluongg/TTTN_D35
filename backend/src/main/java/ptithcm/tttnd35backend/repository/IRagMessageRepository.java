package ptithcm.tttnd35backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ptithcm.tttnd35backend.entity.RagMessage;

import java.util.List;
import java.util.UUID;

@Repository
public interface IRagMessageRepository extends JpaRepository<RagMessage, UUID> {
    List<RagMessage> findByConversationIdOrderByCreatedAtAsc(UUID conversationId);
}
