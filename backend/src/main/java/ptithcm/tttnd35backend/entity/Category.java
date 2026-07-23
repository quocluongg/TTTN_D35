package ptithcm.tttnd35backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.ZonedDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "category")
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    private String slug;

    private String description;

    @Column(name = "parent_id")
    private Long parentId;

    @Column(name = "created_at", updatable = false)
    private ZonedDateTime createdAt;
}
