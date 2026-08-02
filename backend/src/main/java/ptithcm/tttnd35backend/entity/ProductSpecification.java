package ptithcm.tttnd35backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "product_specifications")
public class ProductSpecification extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "spec_group", length = 150)
    private String specGroup;

    @Column(name = "spec_key", nullable = false, length = 150)
    private String specKey;

    @Column(name = "spec_value", nullable = false, length = 500)
    private String specValue;

    @Column(name = "spec_unit", length = 50)
    private String specUnit;
}
