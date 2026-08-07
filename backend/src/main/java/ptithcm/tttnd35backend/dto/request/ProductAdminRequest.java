package ptithcm.tttnd35backend.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductAdminRequest {

    @NotBlank(message = "Tên sản phẩm không được để trống")
    private String name;

    private String description;

    private String brand;

    private String origin;

    // URL ảnh đại diện dùng cho card danh sách - admin dán URL sau khi đã upload qua
    // POST /admin/products/{id}/images (ảnh đầu tiên trong gallery), hoặc dán URL ảnh có sẵn.
    private String thumbnail;

    @NotNull(message = "Danh mục không được để trống")
    private UUID categoryId;

    @Min(value = 0, message = "Số tháng bảo hành phải >= 0")
    private Integer warrantyMonths;

    // Nhãn nhu cầu sử dụng tự do (vd "Gaming", "Văn phòng") để lọc nhanh ở trang danh sách. Optional.
    @Size(max = 100, message = "use_case tối đa 100 ký tự")
    private String useCase;

    // Link nguồn dữ liệu gốc (crawl), chỉ admin xem, optional.
    @Size(max = 2000, message = "source_url tối đa 2000 ký tự")
    private String sourceUrl;

    @Builder.Default
    private List<@Valid CustomTabRequest> customTabs = new ArrayList<>();

    // Mỗi sản phẩm luôn phải có >= 1 variant (kể cả phụ kiện đơn giản không có tùy chọn màu/size...)
    // vì Order/Cart/Campaign đều tham chiếu variant_id, không tham chiếu product_id trực tiếp.
    @NotEmpty(message = "Sản phẩm phải có ít nhất 1 biến thể (variant)")
    private List<@Valid ProductVariantAdminRequest> variants;
}
