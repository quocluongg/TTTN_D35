package ptithcm.tttnd35backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

/**
 * 1 dòng thông số kỹ thuật trong request PUT /admin/products/{id}/specifications (replace-all).
 * Xác định key thuộc tính theo 1 trong 2 cách:
 *  - attributeKeyId: key đã tồn tại sẵn trong từ điển product_attribute_keys.
 *  - attributeName: key chưa có -> Service tự tạo mới (kèm newDisplayName/newUnit nếu có).
 * Ít nhất 1 trong 2 field trên phải có giá trị (validate ở Service, không annotation-level vì
 * là ràng buộc chéo 2 field).
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductSpecificationAdminRequest {

    private Integer attributeKeyId;

    private String attributeName;

    // Chỉ dùng khi attributeName chưa tồn tại trong từ điển - Service tự tạo key mới với các field này.
    private String newDisplayName;

    private String newUnit;

    private String specGroup;

    @NotBlank(message = "Giá trị thông số không được để trống")
    private String specValue;

    // Đơn vị ghi đè riêng cho dòng này - null thì FE dùng unit từ attributeKey.
    private String specUnit;
}
