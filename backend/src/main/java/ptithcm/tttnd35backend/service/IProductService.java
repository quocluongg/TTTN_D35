package ptithcm.tttnd35backend.service;

import org.springframework.web.multipart.MultipartFile;
import ptithcm.tttnd35backend.dto.request.ProductAdminRequest;
import ptithcm.tttnd35backend.dto.request.ProductVariantAdminRequest;
import ptithcm.tttnd35backend.dto.response.ProductDetailResponse;
import ptithcm.tttnd35backend.dto.response.ProductImageResponse;
import ptithcm.tttnd35backend.dto.response.ProductListItemResponse;
import ptithcm.tttnd35backend.dto.response.ProductVariantResponse;
import ptithcm.tttnd35backend.dto.response.pagination.PageResponse;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface IProductService {

    // Public - chỉ trả sản phẩm đang active.
    PageResponse<ProductListItemResponse> getList(
            String categorySlug, String brand, BigDecimal minPrice, BigDecimal maxPrice,
            String search, String specKey, String specValue, String sortBy, int page, int size);

    // Admin - trả cả sản phẩm đang bị ẩn, để còn thấy mà bật lại/sửa. Cùng bộ filter với getList().
    PageResponse<ProductListItemResponse> getListForAdmin(
            String categorySlug, String brand, BigDecimal minPrice, BigDecimal maxPrice,
            String search, String specKey, String specValue, String sortBy, int page, int size);

    // Public - chỉ trả sản phẩm đang active.
    ProductDetailResponse getDetailBySlug(String slug);

    // Admin - xem/sửa theo id, kể cả sản phẩm đang bị ẩn.
    ProductDetailResponse getDetailById(UUID id);

    ProductDetailResponse create(ProductAdminRequest request);

    ProductDetailResponse update(UUID id, ProductAdminRequest request);

    ProductDetailResponse setActive(UUID id, boolean active);

    List<ProductImageResponse> addImages(UUID productId, List<MultipartFile> files);

    void deleteImage(UUID productId, UUID imageId);

    ProductVariantResponse addVariant(UUID productId, ProductVariantAdminRequest request);

    ProductVariantResponse updateVariant(UUID productId, UUID variantId, ProductVariantAdminRequest request);

    void deleteVariant(UUID productId, UUID variantId);
}
