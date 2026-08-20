package ptithcm.tttnd35backend.entity;

import jakarta.persistence.*;
import lombok.*;
import ptithcm.tttnd35backend.util.enums.CartSource;
import lombok.experimental.SuperBuilder;

import java.util.UUID;

/**
 * Lịch sử mỗi lần "thêm vào giỏ hàng" - bảng event log (không phải snapshot giỏ hiện tại).
 * Dùng để đếm số lượt thêm theo nguồn (CHATBOT từ gợi ý bot, BROWSE từ duyệt web)
 * và làm dashboard chuyển đổi.
 */
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "add_to_cart_events")
public class AddToCartEvent extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "profile_id", nullable = false)
    private Profile profile;

    @Column(name = "product_id", nullable = false)
    private UUID productId;

    @Column(name = "variant_id", nullable = false)
    private UUID variantId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CartSource source;

    // Chỉ có khi nguồn là CHATBOT - biết bot gợi ý từ hội thoại nào.
    @Column(name = "conversation_id")
    private UUID conversationId;
}
