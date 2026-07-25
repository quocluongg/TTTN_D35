package ptithcm.tttnd35backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
@Entity @Table(name = "system_configs")
public class SystemConfig {
    @Id @Column(name = "config_key", length = 120) private String key;
    @Column(name = "config_value", nullable = false, columnDefinition = "text") private String value;
    @Column(name = "value_type", nullable = false, length = 30) private String valueType;
    @Column(columnDefinition = "text") private String description;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "updated_by") private Profile updatedBy;
    @Column(name = "created_at", updatable = false) private LocalDateTime createdAt;
    @Column(name = "updated_at") private LocalDateTime updatedAt;
    @PrePersist void created() { createdAt = LocalDateTime.now(); }
    @PreUpdate void updated() { updatedAt = LocalDateTime.now(); }
}
