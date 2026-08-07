package ptithcm.tttnd35backend.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import ptithcm.tttnd35backend.util.enums.DiscountType;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "vouchers")
public class Voucher extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    // Nullable - voucher có thể phát hành độc lập, không thuộc đợt khuyến mãi nào.
    @Column(name = "campaign_id")
    private UUID campaignId;

    @Column(columnDefinition = "text")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "discount_type", nullable = false, length = 20)
    private DiscountType discountType;

    // PERCENT: 0-100. FIXED_AMOUNT: số tiền giảm trực tiếp.
    @Column(name = "discount_value", nullable = false, precision = 12, scale = 2)
    private BigDecimal discountValue;

    // Chỉ có ý nghĩa với PERCENT - chặn giảm quá nhiều khi đơn hàng giá trị lớn (vd "giảm 20%, tối đa 100k").
    @Column(name = "max_discount_amount", precision = 12, scale = 2)
    private BigDecimal maxDiscountAmount;

    @Builder.Default
    @Column(name = "min_order_value", nullable = false, precision = 14, scale = 2)
    private BigDecimal minOrderValue = BigDecimal.ZERO;

    // Null = không giới hạn tổng lượt dùng.
    @Column(name = "max_usage")
    private Integer maxUsage;

    @Builder.Default
    @Column(name = "max_usage_per_user", nullable = false)
    private Integer maxUsagePerUser = 1;

    // Đếm tổng lượt đã dùng - tăng dần khi VoucherUsage được ghi nhận lúc tạo Order (giai đoạn 5).
    @Builder.Default
    @Column(name = "used_count", nullable = false)
    private Integer usedCount = 0;

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;
}
