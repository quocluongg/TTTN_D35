package ptithcm.tttnd35backend.dto.response;

import lombok.Builder;
import lombok.Data;
import ptithcm.tttnd35backend.util.enums.MessageFlagStatus;
import ptithcm.tttnd35backend.util.enums.MessageRole;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class ChatMessageResponse {
    private UUID id;
    private UUID conversationId;
    private MessageRole role;
    private String content;
    private String intent;
    private Double confidence;
    private Integer latencyMs;
    private String sources;
    private UUID[] productIds;
    private MessageFlagStatus flagStatus;
    private String flagNote;
    private LocalDateTime createdAt;
}