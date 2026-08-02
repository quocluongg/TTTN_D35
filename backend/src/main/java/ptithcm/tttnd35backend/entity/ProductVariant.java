package ptithcm.tttnd35backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "product_variants")
public class ProductVariant extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "UUID")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    private String sku;

    private BigDecimal price;

    private Integer stock;

    private String image;

    @Column(name = "discount_percent")
    private BigDecimal discountPercent;

    @Column(columnDefinition = "jsonb")
    private String attributes;

    @Column(name = "vat_percent")
    private BigDecimal vatPercent;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;
}

