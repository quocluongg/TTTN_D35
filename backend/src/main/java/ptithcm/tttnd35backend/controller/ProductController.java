package ptithcm.tttnd35backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import ptithcm.tttnd35backend.dto.response.ApiResponse;
import ptithcm.tttnd35backend.dto.response.ProductDetailResponse;
import ptithcm.tttnd35backend.dto.response.ProductListItemResponse;
import ptithcm.tttnd35backend.dto.response.pagination.PageResponse;
import ptithcm.tttnd35backend.service.IProductService;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/** Public - khách xem/lọc/tìm sản phẩm, không cần đăng nhập. */
@RestController
@RequestMapping({"/api/v1/products", "/products"})
@RequiredArgsConstructor
public class ProductController {

    private final IProductService productService;

    @GetMapping
    public ApiResponse<PageResponse<ProductListItemResponse>> getList(
            @RequestParam(required = false) String categorySlug,
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String specKey,
            @RequestParam(required = false) String specValue,
            @RequestParam(required = false) String sortBy,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        var data = productService.getList(categorySlug, brand, minPrice, maxPrice, search, specKey, specValue, sortBy, page, size);
        return ApiResponse.<PageResponse<ProductListItemResponse>>builder()
                .success(true)
                .data(data)
                .timestamp(LocalDateTime.now())
                .build();
    }

    @GetMapping("/{slugOrId}")
    public ApiResponse<ProductDetailResponse> getDetail(@PathVariable String slugOrId) {
        ProductDetailResponse detail;
        try {
            UUID id = UUID.fromString(slugOrId);
            detail = productService.getDetailById(id);
        } catch (IllegalArgumentException e) {
            detail = productService.getDetailBySlug(slugOrId);
        }

        return ApiResponse.<ProductDetailResponse>builder()
                .success(true)
                .data(detail)
                .timestamp(LocalDateTime.now())
                .build();
    }
}
