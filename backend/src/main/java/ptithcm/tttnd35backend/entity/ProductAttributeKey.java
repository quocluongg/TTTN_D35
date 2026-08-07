package ptithcm.tttnd35backend.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Bảng lookup các tên thông số kỹ thuật chuẩn (RAM, CPU, Ổ cứng, ...).
 * Seed sẵn trong migration V30; Admin có thể thêm key mới qua API.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "product_attribute_keys")
public class ProductAttributeKey {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    /** Tên key nội bộ / dùng để dedup, unique. Ví dụ: "RAM", "Ổ cứng". */
    @Column(nullable = false, unique = true, length = 255)
    private String name;

    /** Nhãn hiển thị thân thiện hơn. Ví dụ: "Dung lượng RAM". Nếu null thì UI dùng name. */
    @Column(name = "display_name", length = 255)
    private String displayName;

    /** Đơn vị mặc định (GB, Hz, kg, ...). Nullable — không phải key nào cũng có đơn vị. */
    @Column(length = 50)
    private String unit;

    /** Thứ tự hiển thị trong dropdown / bảng thông số. */
    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private int sortOrder = 0;
}
