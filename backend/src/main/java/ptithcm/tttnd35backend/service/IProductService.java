package ptithcm.tttnd35backend.service;

import org.springframework.web.multipart.MultipartFile;
import ptithcm.tttnd35backend.dto.request.ProductAdminRequest;
import ptithcm.tttnd35backend.dto.request.ProductSpecificationAdminRequest;
import ptithcm.tttnd35backend.dto.request.ProductVariantAdminRequest;
import ptithcm.tttnd35backend.dto.response.ProductDetailResponse;
import ptithcm.tttnd35backend.dto.response.ProductImageResponse;
import ptithcm.tttnd35backend.dto.response.ProductListItemResponse;
import ptithcm.tttnd35backend.dto.response.ProductSpecificationResponse;
import ptithcm.tttnd35backend.dto.response.ProductVariantResponse;
import ptithcm.tttnd35backend.dto.response.pagination.PageResponse;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface IProductService {

    // Public - chỉ trả sản phẩm đang active. specs: map specKey/specValue lọc AND (vd RAM=16GB & CPU=i5).
    PageResponse<ProductListItemResponse> getList(
            String categorySlug, String brand, String useCase, BigDecimal minPrice, BigDecimal maxPrice,
            String search, Map<String, String> specs, String sortBy, int page, int size);

    // Admin - trả cả sản phẩm đang bị ẩn, để còn thấy mà bật lại/sửa. Cùng bộ filter với getList().
    PageResponse<ProductListItemResponse> getListForAdmin(
            String categorySlug, String brand, String useCase, BigDecimal minPrice, BigDecimal maxPrice,
            String search, Map<String, String> specs, String sortBy, int page, int size);

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

    // Soft-delete (khuyến nghị dùng thay deleteVariant khi variant đã từng bán, vd hết hàng dài hạn).
    ProductVariantResponse setVariantActive(UUID productId, UUID variantId, boolean active);

    // Xóa cứng - chỉ cho phép khi variant chưa từng phát sinh đơn hàng nào (xem ProductServiceImpl).
    void deleteVariant(UUID productId, UUID variantId);

    // ===== Specification (EAV) =====

    List<ProductSpecificationResponse> getSpecifications(UUID productId);

    // Replace-all: xóa hết spec cũ rồi ghi lại toàn bộ danh sách mới trong 1 transaction.
    // Mỗi dòng resolve key theo attributeKeyId (đã có) hoặc attributeName (tự tạo key mới nếu chưa có).
    List<ProductSpecificationResponse> replaceSpecifications(UUID productId, List<ProductSpecificationAdminRequest> requests);
}
