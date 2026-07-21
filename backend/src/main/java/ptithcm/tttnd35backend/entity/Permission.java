package ptithcm.tttnd35backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "permissions")
public class Permission extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 100)
    private String code; // "PRODUCT_CREATE", "ORDER_UPDATE_STATUS"...

    @Column(columnDefinition = "TEXT")
    private String description;
}
