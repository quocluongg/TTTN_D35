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
@Table(name = "home_layout_sections")
public class HomeLayoutSection extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "section_key", nullable = false, length = 100)
    private String sectionKey;

    @Column(length = 255)
    private String title;

    @Column(length = 500)
    private String subtitle;

    @Builder.Default
    @Column(name = "display_order", nullable = false)
    private int displayOrder = 0;

    @Builder.Default
    @Column(name = "enabled", nullable = false)
    private boolean enabled = true;

    @Column(name = "layout_style", length = 100)
    private String layoutStyle;

    @Column(name = "config_json", columnDefinition = "TEXT")
    private String configJson;
}
