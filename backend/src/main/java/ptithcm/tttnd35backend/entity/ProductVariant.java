package ptithcm.tttnd35backend.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

/**
 * productId để dạng cột FK thô (không map quan hệ ngược tới Product), giống ProductImage.
 * attributes giữ dạng jsonb có chủ đích (xem giải trình trong DB_Design.docx mục IV.1):
 * tập thuộc tính biến thể thay đổi tùy loại sản phẩm, chỉ phục vụ hiển thị lựa chọn khi mua hàng.
 */
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "product_variants")
public class ProductVariant extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "product_id", nullable = false)
    private UUID productId;

    @Column(nullable = false, unique = true, length = 30)
    private String sku;

    // BE tự build từ attributes lúc tạo/sửa (vd "Đen - 256GB"). Null nếu variant mặc định không có option.
    @Column(name = "variant_name", length = 255)
    private String variantName;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    @Column(nullable = false)
    private int stock;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    @Builder.Default
    private Map<String, String> attributes = new LinkedHashMap<>();

    @Column(name = "vat_percent", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal vatPercent = BigDecimal.ZERO;

    // Ảnh riêng theo màu, override Product.thumbnail khi khách chọn variant này. Nullable.
    private String image;

    // Soft-delete: DB có unique index (product_id, attributes) WHERE is_active = true nên tắt biến thể
    // (thay vì xóa cứng) vẫn cho phép tạo lại đúng attributes đó sau này. Xem ProductServiceImpl#setVariantActive.
    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;
}
