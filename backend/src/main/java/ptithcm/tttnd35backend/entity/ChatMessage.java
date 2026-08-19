package ptithcm.tttnd35backend.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import ptithcm.tttnd35backend.util.enums.MessageFlagStatus;
import ptithcm.tttnd35backend.util.enums.MessageRole;

import java.util.UUID;

@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "chat_messages")
public class ChatMessage extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id", nullable = false)
    private ChatConversation conversation;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private MessageRole role;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(length = 40)
    private String intent;

    private Double confidence;

    @Column(name = "latency_ms")
    private Integer latencyMs;

    @Column(columnDefinition = "jsonb")
    private String sources;

    @Column(name = "product_ids", columnDefinition = "uuid[]")
    private UUID[] productIds;

    @Enumerated(EnumType.STRING)
    @Column(name = "flag_status", nullable = false, length = 20)
    @Builder.Default
    private MessageFlagStatus flagStatus = MessageFlagStatus.NONE;

    @Column(name = "flag_note")
    private String flagNote;
}