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
@Table(name = "sensitive_questions")
public class SensitiveQuestion extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 255)
    private String pattern;

    @Column(length = 40)
    private String category;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;
}