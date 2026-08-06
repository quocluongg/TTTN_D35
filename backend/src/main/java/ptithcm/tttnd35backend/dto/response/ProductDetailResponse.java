package ptithcm.tttnd35backend.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Dùng cho GET /products/{slug} (trang chi tiết) và admin xem/sửa theo id.
 * variants/images/breadcrumb được Service gán thủ công sau khi Mapper dựng phần field phẳng
 * (xem ProductServiceImpl) - tránh MapStruct phải biết cách load các bảng con.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductDetailResponse {
    private UUID id;
    private String slug;
    private String name;
    private String description;
    private String brand;
    private String origin;
    private String thumbnail;
    private Integer warrantyMonths;
    private BigDecimal ratingAvg;
    private int reviewCount;
    private boolean isActive;
    private int soldQuantity;
    private String useCase;

    // Chỉ phục vụ admin đối chiếu nguồn crawl, FE trang khách không hiển thị field này.
    private String sourceUrl;

    @Builder.Default
    private List<CustomTabResponse> customTabs = new ArrayList<>();

    // Breadcrumb từ danh mục gốc -> danh mục lá đang gắn, suy ra ngược qua parentId.
    @Builder.Default
    private List<CategoryResponse> categoryBreadcrumb = new ArrayList<>();

    @Builder.Default
    private List<ProductVariantResponse> variants = new ArrayList<>();

    @Builder.Default
    private List<ProductImageResponse> images = new ArrayList<>();
}
