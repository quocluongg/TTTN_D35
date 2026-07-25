package ptithcm.tttnd35backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "rag_messages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RagMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id", nullable = false)
    private RagConversation conversation;

    @Column(nullable = false, length = 20)
    private String role; // "USER", "ASSISTANT", "SYSTEM"

    @Column(nullable = false, columnDefinition = "text")
    private String content;

    @Column(precision = 5, scale = 4)
    private BigDecimal confidence;

    @Column(columnDefinition = "jsonb")
    private String sources;

    @Column(name = "suggested_products", columnDefinition = "jsonb")
    private String suggestedProducts;

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String provider = "mock";

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
