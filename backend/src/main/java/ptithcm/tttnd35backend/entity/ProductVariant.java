package ptithcm.tttnd35backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.ZonedDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "product_variant")
public class ProductVariant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    private String sku;

    private BigDecimal price;

    private Integer stock;

    private String image;

    @Column(name = "discount_percent")
    private BigDecimal discountPercent;

    @Column(name = "created_at", updatable = false)
    private ZonedDateTime createdAt;
}
