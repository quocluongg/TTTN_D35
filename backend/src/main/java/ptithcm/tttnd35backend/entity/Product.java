package ptithcm.tttnd35backend.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import ptithcm.tttnd35backend.entity.jsonb.CustomTabItem;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * KHÔNG map @OneToMany 2 chiều tới ProductImage/ProductVariant ở đây
 * (tránh lazy-load kéo cả list mỗi lần load Product cho việc khác, vd chỉ cần
 * sửa tên sản phẩm cũng phải load hết ảnh/variant). Ảnh và variant được load
 * riêng qua IProductImageRepository/IProductVariantRepository theo productId
 * khi thực sự cần (trang chi tiết).
 *
 * Chiều Product -> Category giữ @ManyToOne vì đây là quan hệ n-1 đơn (không phải
 * collection), fetch join 1 lần là đủ, không có rủi ro N+1.
 */
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "products")
public class Product extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(nullable = false, unique = true, length = 280)
    private String slug;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 100)
    private String brand;

    @Column(length = 100)
    private String origin;

    private String thumbnail;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @Column(name = "warranty_months")
    private Integer warrantyMonths;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "custom_tabs", columnDefinition = "jsonb")
    @Builder.Default
    private List<CustomTabItem> customTabs = new ArrayList<>();

    // Denormalized, cập nhật lại mỗi khi ProductReview thay đổi (module Review, giai đoạn 6).
    @Builder.Default
    @Column(name = "rating_avg", precision = 2, scale = 1)
    private BigDecimal ratingAvg = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "review_count")
    private int reviewCount = 0;

    // Ẩn sản phẩm hết hàng dài hạn mà không xóa, tránh vỡ FK với OrderItem/Review về sau.
    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;
}
