package ptithcm.tttnd35backend.entity;

import jakarta.persistence.Embeddable;
import lombok.*;

import java.io.Serializable;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
@Embeddable
public class ProductCategoryMappingId implements Serializable {
    private UUID productId;
    private UUID categoryId;
}
