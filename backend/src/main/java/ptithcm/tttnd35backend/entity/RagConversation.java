package ptithcm.tttnd35backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.ZonedDateTime;
import java.util.UUID;

@Entity
@Table(name = "rag_conversations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RagConversation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private Profile user;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "ACTIVE";

    @Column(name = "started_at", nullable = false, updatable = false)
    @Builder.Default
    private ZonedDateTime startedAt = ZonedDateTime.now();

    @Column(name = "ended_at")
    private ZonedDateTime endedAt;

    @Column(columnDefinition = "jsonb")
    private String metadata;
}
