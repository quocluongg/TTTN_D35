package ptithcm.tttnd35backend.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import ptithcm.tttnd35backend.dto.request.ProductAdminRequest;
import ptithcm.tttnd35backend.dto.request.ProductVariantAdminRequest;
import ptithcm.tttnd35backend.dto.request.StatusRequest;
import ptithcm.tttnd35backend.dto.request.VariantStatusRequest;
import ptithcm.tttnd35backend.dto.response.ApiResponse;
import ptithcm.tttnd35backend.dto.response.ProductDetailResponse;
import ptithcm.tttnd35backend.dto.response.ProductImageResponse;
import ptithcm.tttnd35backend.dto.response.ProductListItemResponse;
import ptithcm.tttnd35backend.dto.response.ProductVariantResponse;
import ptithcm.tttnd35backend.dto.response.pagination.PageResponse;
import ptithcm.tttnd35backend.service.IProductService;
import ptithcm.tttnd35backend.util.helper.SpecFilterParamUtil;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class AdminProductController {

    private final IProductService productService;

    // List phân trang cho bảng quản lý sản phẩm - kể cả sản phẩm đang bị ẩn (khác GET /products công khai).
    @GetMapping("/admin/products")
    @PreAuthorize("hasAuthority('PRODUCT_UPDATE')")
    public ApiResponse<PageResponse<ProductListItemResponse>> getList(
            HttpServletRequest request,
            @RequestParam(required = false) String categorySlug,
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) String useCase,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String sortBy,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        var specs = SpecFilterParamUtil.extract(request);
        var data = productService.getListForAdmin(categorySlug, brand, useCase, minPrice, maxPrice, search, specs, sortBy, page, size);
        return ApiResponse.<PageResponse<ProductListItemResponse>>builder()
                .success(true)
                .data(data)
                .timestamp(LocalDateTime.now())
                .build();
    }

    @GetMapping("/admin/products/{id}")
    @PreAuthorize("hasAuthority('PRODUCT_UPDATE')")
    public ApiResponse<ProductDetailResponse> getDetail(@PathVariable UUID id) {
        return ApiResponse.<ProductDetailResponse>builder()
                .success(true)
                .data(productService.getDetailById(id))
                .timestamp(LocalDateTime.now())
                .build();
    }

    @PostMapping("/admin/products")
    @PreAuthorize("hasAuthority('PRODUCT_CREATE')")
    public ApiResponse<ProductDetailResponse> create(@RequestBody @Valid ProductAdminRequest request) {
        return ApiResponse.<ProductDetailResponse>builder()
                .success(true)
                .message("Tạo sản phẩm thành công")
                .data(productService.create(request))
                .timestamp(LocalDateTime.now())
                .build();
    }

    @PutMapping("/admin/products/{id}")
    @PreAuthorize("hasAuthority('PRODUCT_UPDATE')")
    public ApiResponse<ProductDetailResponse> update(
            @PathVariable UUID id, @RequestBody @Valid ProductAdminRequest request) {
        return ApiResponse.<ProductDetailResponse>builder()
                .success(true)
                .message("Cập nhật sản phẩm thành công")
                .data(productService.update(id, request))
                .timestamp(LocalDateTime.now())
                .build();
    }

    // Ẩn/khôi phục sản phẩm - không có hard-delete (Order/Review/CampaignItem/ProductChunk sẽ tham chiếu product_id sau này).
    @PatchMapping("/admin/products/{id}/status")
    @PreAuthorize("hasAuthority('PRODUCT_DELETE')")
    public ApiResponse<ProductDetailResponse> setStatus(
            @PathVariable UUID id, @RequestBody @Valid StatusRequest request) {
        ProductDetailResponse response = productService.setActive(id, request.getIsActive());
        return ApiResponse.<ProductDetailResponse>builder()
                .success(true)
                .message(request.getIsActive() ? "Đã khôi phục sản phẩm" : "Đã ẩn sản phẩm")
                .data(response)
                .timestamp(LocalDateTime.now())
                .build();
    }

    @PostMapping(value = "/admin/products/{id}/images", consumes = "multipart/form-data")
    @PreAuthorize("hasAuthority('PRODUCT_UPDATE')")
    public ApiResponse<List<ProductImageResponse>> addImages(
            @PathVariable UUID id, @RequestParam("files") List<MultipartFile> files) {
        return ApiResponse.<List<ProductImageResponse>>builder()
                .success(true)
                .message("Tải ảnh lên thành công")
                .data(productService.addImages(id, files))
                .timestamp(LocalDateTime.now())
                .build();
    }

    @DeleteMapping("/admin/products/{id}/images/{imageId}")
    @PreAuthorize("hasAuthority('PRODUCT_UPDATE')")
    public ApiResponse<?> deleteImage(@PathVariable UUID id, @PathVariable UUID imageId) {
        productService.deleteImage(id, imageId);
        return ApiResponse.builder()
                .success(true)
                .message("Xóa ảnh thành công")
                .timestamp(LocalDateTime.now())
                .build();
    }

    @PostMapping("/admin/products/{id}/variants")
    @PreAuthorize("hasAuthority('PRODUCT_UPDATE')")
    public ApiResponse<ProductVariantResponse> addVariant(
            @PathVariable UUID id, @RequestBody @Valid ProductVariantAdminRequest request) {
        return ApiResponse.<ProductVariantResponse>builder()
                .success(true)
                .message("Thêm biến thể thành công")
                .data(productService.addVariant(id, request))
                .timestamp(LocalDateTime.now())
                .build();
    }

    @PutMapping("/admin/products/{id}/variants/{variantId}")
    @PreAuthorize("hasAuthority('PRODUCT_UPDATE')")
    public ApiResponse<ProductVariantResponse> updateVariant(
            @PathVariable UUID id, @PathVariable UUID variantId,
            @RequestBody @Valid ProductVariantAdminRequest request) {
        return ApiResponse.<ProductVariantResponse>builder()
                .success(true)
                .message("Cập nhật biến thể thành công")
                .data(productService.updateVariant(id, variantId, request))
                .timestamp(LocalDateTime.now())
                .build();
    }

    // Soft-delete - bật/tắt biến thể, dùng thay cho xóa cứng khi biến thể đã từng phát sinh đơn hàng.
    @PatchMapping("/admin/products/{id}/variants/{variantId}/active")
    @PreAuthorize("hasAuthority('PRODUCT_UPDATE')")
    public ApiResponse<ProductVariantResponse> setVariantActive(
            @PathVariable UUID id, @PathVariable UUID variantId, @RequestBody @Valid VariantStatusRequest request) {
        ProductVariantResponse response = productService.setVariantActive(id, variantId, request.getActive());
        return ApiResponse.<ProductVariantResponse>builder()
                .success(true)
                .message(request.getActive() ? "Đã bật lại biến thể" : "Đã tắt biến thể")
                .data(response)
                .timestamp(LocalDateTime.now())
                .build();
    }

    @DeleteMapping("/admin/products/{id}/variants/{variantId}")
    @PreAuthorize("hasAuthority('PRODUCT_UPDATE')")
    public ApiResponse<?> deleteVariant(@PathVariable UUID id, @PathVariable UUID variantId) {
        productService.deleteVariant(id, variantId);
        return ApiResponse.builder()
                .success(true)
                .message("Xóa biến thể thành công")
                .timestamp(LocalDateTime.now())
                .build();
    }
}
