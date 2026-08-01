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
    // Object thay vì String: tab có thể chứa văn bản tự do ("Mô tả chi tiết") hoặc bảng
    // key-value thông số kỹ thuật ("Thông số kỹ thuật": {"CPU": "...", "RAM": "..."}).
    // Jackson tự nhận diện: string JSON -> String, object JSON -> LinkedHashMap.
    private Object content;
}
