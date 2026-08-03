package ptithcm.tttnd35backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import ptithcm.tttnd35backend.dto.response.ApiResponse;
import ptithcm.tttnd35backend.dto.response.CategoryResponse;
import ptithcm.tttnd35backend.dto.response.CategoryTreeResponse;
import ptithcm.tttnd35backend.service.ICategoryService;

import java.time.LocalDateTime;
import java.util.List;

/** Public - khách xem danh mục, không cần đăng nhập. */
@RestController
@RequestMapping({"/api/v1/categories", "/categories"})
@RequiredArgsConstructor
public class CategoryController {

    private final ICategoryService categoryService;

    @GetMapping
    public ApiResponse<List<CategoryTreeResponse>> getTree() {
        return ApiResponse.<List<CategoryTreeResponse>>builder()
                .success(true)
                .data(categoryService.getTree())
                .timestamp(LocalDateTime.now())
                .build();
    }

    @GetMapping("/{slug}/breadcrumb")
    public ApiResponse<List<CategoryResponse>> getBreadcrumb(@PathVariable String slug) {
        return ApiResponse.<List<CategoryResponse>>builder()
                .success(true)
                .data(categoryService.getBreadcrumb(slug))
                .timestamp(LocalDateTime.now())
                .build();
    }
}
