package ptithcm.tttnd35backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

/**
 * Một hàng thông số kỹ thuật của sản phẩm.
 * Trước đây lưu spec_key dưới dạng varchar tự do; nay chuẩn hóa bằng FK sang ProductAttributeKey.
 *
 * Không extend BaseEntity vì bảng không cần created_at / updated_at.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "product_attribute_values")
public class ProductSpecification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** FK tới products.id — không map ngược tới Product để tránh lazy-load không cần thiết. */
    @Column(name = "product_id", nullable = false)
    private UUID productId;

    /** FK tới product_attribute_keys.id — xác định tên thông số (RAM, CPU, ...). */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "attribute_key_id", nullable = false)
    private ProductAttributeKey attributeKey;

    /** Nhóm hiển thị (Thông số kỹ thuật, Kết nối, ...). Nullable cho phép không nhóm. */
    @Column(name = "spec_group", length = 150)
    private String specGroup;

    /** Giá trị thông số. Ví dụ: "16GB", "Intel Core Ultra 5 225U". */
    @Column(name = "spec_value", nullable = false, length = 500)
    private String specValue;

    /**
     * Đơn vị ghi đè riêng cho hàng này (tùy chọn).
     * Nếu null, UI dùng unit từ attributeKey.unit.
     */
    @Column(name = "spec_unit", length = 50)
    private String specUnit;
}
