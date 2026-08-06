package ptithcm.tttnd35backend.controller;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import ptithcm.tttnd35backend.dto.response.ApiResponse;
import ptithcm.tttnd35backend.dto.response.ProductDetailResponse;
import ptithcm.tttnd35backend.dto.response.ProductListItemResponse;
import ptithcm.tttnd35backend.dto.response.pagination.PageResponse;
import ptithcm.tttnd35backend.service.IProductService;
import ptithcm.tttnd35backend.util.helper.SpecFilterParamUtil;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/** Public - khách xem/lọc/tìm sản phẩm, không cần đăng nhập. */
@RestController
@RequestMapping({"/api/v1/products", "/products"})
@RequiredArgsConstructor
public class ProductController {

    private final IProductService productService;

    // Lọc nhiều thông số kỹ thuật cùng lúc qua query param động "spec.<key>=<value>"
    // (vd ?spec.RAM=16GB&spec.CPU=Intel), xem SpecFilterParamUtil.
    @GetMapping
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
        var data = productService.getList(categorySlug, brand, useCase, minPrice, maxPrice, search, specs, sortBy, page, size);
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
