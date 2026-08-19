package ptithcm.tttnd35backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import ptithcm.tttnd35backend.entity.ChatConversation;

import java.util.Optional;
import java.util.UUID;

public interface IChatConversationRepository extends JpaRepository<ChatConversation, UUID>, JpaSpecificationExecutor<ChatConversation> {
    Optional<ChatConversation> findBySessionId(String sessionId);
}