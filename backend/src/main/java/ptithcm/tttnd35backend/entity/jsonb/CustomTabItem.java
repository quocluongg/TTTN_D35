package ptithcm.tttnd35backend.entity.jsonb;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 1 tab nội dung tự do admin thêm ở trang chi tiết sản phẩm (vd "Điểm nổi bật", "Chính sách bảo hành"...).
 * Lưu dạng jsonb (List<CustomTabItem>) trong cột Product.custom_tabs.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomTabItem {
    private String title;
    private String content;
}
