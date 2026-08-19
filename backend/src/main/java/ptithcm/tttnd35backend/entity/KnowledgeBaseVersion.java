package ptithcm.tttnd35backend.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.util.UUID;

@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "knowledge_base_version")
public class KnowledgeBaseVersion extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "chunking_strategy", length = 100)
    private String chunkingStrategy;

    @Column(name = "embedding_model", length = 100)
    private String embeddingModel;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;
}