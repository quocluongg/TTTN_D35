package ptithcm.tttnd35backend.dto.response;

import lombok.Builder;
import lombok.Data;
import ptithcm.tttnd35backend.util.enums.ChatSource;
import ptithcm.tttnd35backend.util.enums.ConversationStatus;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class ChatConversationResponse {
    private UUID id;
    private String sessionId;
    private UUID userId;
    private String userEmail;
    private String userName;
    private ConversationStatus status;
    private UUID handoffStaffId;
    private String handoffStaffName;
    private ChatSource source;
    private UUID kbVersionId;
    private String kbVersionName;
    private LocalDateTime startedAt;
    private LocalDateTime endedAt;
    private long messageCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}