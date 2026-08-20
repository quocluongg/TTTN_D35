package ptithcm.tttnd35backend.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import ptithcm.tttnd35backend.util.enums.CartSource;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

/**
 * orderId/productId/variantId để cột FK thô (giống CampaignItem) - luôn load hàng loạt theo orderId
 * khi xem chi tiết 1 đơn, không cần navigate ngược.
 * priceAtPurchase/attributesSnapshot là SNAPSHOT lúc mua - không đọc lại giá/attributes hiện tại
 * của variant vì có thể đã đổi sau đó.
 */
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "order_items")
public class OrderItem extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "order_id", nullable = false)
    private UUID orderId;

    @Column(name = "product_id", nullable = false)
    private UUID productId;

    @Column(name = "variant_id", nullable = false)
    private UUID variantId;

    @Column(nullable = false)
    private int quantity;

    @Column(name = "price_at_purchase", nullable = false, precision = 12, scale = 2)
    private BigDecimal priceAtPurchase;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "attributes_snapshot", columnDefinition = "jsonb")
    private Map<String, String> attributesSnapshot;

    // Nguồn của dòng đơn này (CHATBOT/BROWSE) - copy từ add_to_cart_events khi checkout,
    // để tính doanh thu & chuyển đổi theo nguồn. NULL = chưa tracking (đơn cũ).
    @Enumerated(EnumType.STRING)
    @Column(name = "source")
    private CartSource source;
}
