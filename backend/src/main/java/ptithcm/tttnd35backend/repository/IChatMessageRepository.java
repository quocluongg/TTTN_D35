package ptithcm.tttnd35backend.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import ptithcm.tttnd35backend.entity.ChatMessage;
import ptithcm.tttnd35backend.util.enums.MessageFlagStatus;

import java.util.UUID;

public interface IChatMessageRepository extends JpaRepository<ChatMessage, UUID>, JpaSpecificationExecutor<ChatMessage> {
    Page<ChatMessage> findByConversationId(UUID conversationId, Pageable pageable);
    long countByFlagStatus(MessageFlagStatus status);
    long countByConversationId(UUID conversationId);
}