package ptithcm.tttnd35backend.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import ptithcm.tttnd35backend.util.enums.DiscountType;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * campaignId/variantId để dạng cột FK thô (giống ProductImage/ProductVariant) - đây là bảng chi tiết
 * luôn được load hàng loạt theo campaignId (trang quản lý 1 campaign) hoặc tra theo variantId
 * (kiểm tra 1 variant có đang sale không), không cần navigate qua Campaign.items.
 */
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "campaign_items")
public class CampaignItem extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "campaign_id", nullable = false)
    private UUID campaignId;

    @Column(name = "variant_id", nullable = false)
    private UUID variantId;

    @Enumerated(EnumType.STRING)
    @Column(name = "discount_type", nullable = false, length = 20)
    private DiscountType discountType;

    // PERCENT: 0-100 (vd 20 = giảm 20%). FIXED_AMOUNT: số tiền giảm trực tiếp trên giá variant hiện tại.
    @Column(name = "discount_value", nullable = false, precision = 12, scale = 2)
    private BigDecimal discountValue;

    // Null = không giới hạn số suất sale riêng (chỉ bị chặn bởi tồn kho variant chung).
    @Column(name = "stock_quantity")
    private Integer stockQuantity;
}
