package ptithcm.tttnd35backend.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import ptithcm.tttnd35backend.util.enums.CartSource;

import java.util.UUID;


@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "cart_items")
public class CartItem extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "profile_id", nullable = false)
    private Profile profile;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "variant_id", nullable = false)
    private ProductVariant variant;

    @Column(nullable = false)
    private int quantity;

    // Nguồn thêm vào giỏ: CHATBOT (từ gợi ý bot) hoặc BROWSE (duyệt web bình thường).
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private CartSource source = CartSource.BROWSE;
}
