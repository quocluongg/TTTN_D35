package ptithcm.tttnd35backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import ptithcm.tttnd35backend.dto.response.ApiResponse;
import ptithcm.tttnd35backend.dto.response.ProductResponse;
import ptithcm.tttnd35backend.service.IProductService;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequiredArgsConstructor
public class ProductController {

    private final IProductService productService;

    @GetMapping("/products")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getProducts(
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(value = "use_case", required = false) List<String> useCases,
            @RequestParam(value = "max_price", required = false) Long maxPrice,
            @RequestParam(value = "sort_by", required = false) String sortBy
    ) {
        List<ProductResponse> products = productService.getProducts(category, useCases, maxPrice, sortBy);
        return ResponseEntity.ok(ApiResponse.<List<ProductResponse>>builder()
                .success(true)
                .message("Lấy danh sách sản phẩm thành công")
                .data(products)
                .timestamp(LocalDateTime.now())
                .build());
    }

    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<List<String>>> getCategories() {
        List<String> categories = productService.getAllCategoryNames();
        return ResponseEntity.ok(ApiResponse.<List<String>>builder()
                .success(true)
                .message("Lấy danh sách danh mục thành công")
                .data(categories)
                .timestamp(LocalDateTime.now())
                .build());
    }
}
