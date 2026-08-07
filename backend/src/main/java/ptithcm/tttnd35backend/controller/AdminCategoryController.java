package ptithcm.tttnd35backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import ptithcm.tttnd35backend.dto.request.CategoryRequest;
import ptithcm.tttnd35backend.dto.request.StatusRequest;
import ptithcm.tttnd35backend.dto.response.ApiResponse;
import ptithcm.tttnd35backend.dto.response.CategoryResponse;
import ptithcm.tttnd35backend.dto.response.CategoryTreeResponse;
import ptithcm.tttnd35backend.service.ICategoryService;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/admin/categories")
@RequiredArgsConstructor
public class AdminCategoryController {

    private final ICategoryService categoryService;

    // Cây đầy đủ kể cả danh mục đang ẩn
    @GetMapping
    @PreAuthorize("hasAuthority('CATEGORY_UPDATE')")
    public ApiResponse<List<CategoryTreeResponse>> getTree() {
        return ApiResponse.<List<CategoryTreeResponse>>builder()
                .success(true)
                .data(categoryService.getTreeForAdmin())
                .timestamp(LocalDateTime.now())
                .build();
    }

    @PostMapping
    @PreAuthorize("hasAuthority('CATEGORY_CREATE')")
    public ApiResponse<CategoryResponse> create(@RequestBody @Valid CategoryRequest request) {
        return ApiResponse.<CategoryResponse>builder()
                .success(true)
                .message("Tạo danh mục thành công")
                .data(categoryService.create(request))
                .timestamp(LocalDateTime.now())
                .build();
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('CATEGORY_UPDATE')")
    public ApiResponse<CategoryResponse> update(@PathVariable UUID id, @RequestBody @Valid CategoryRequest request) {
        return ApiResponse.<CategoryResponse>builder()
                .success(true)
                .message("Cập nhật danh mục thành công")
                .data(categoryService.update(id, request))
                .timestamp(LocalDateTime.now())
                .build();
    }

    // Ẩn (isActive=false) hoặc khôi phục (isActive=true) - không có hard-delete cho danh mục.
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAuthority('CATEGORY_DELETE')")
    public ApiResponse<CategoryResponse> setStatus(@PathVariable UUID id, @RequestBody @Valid StatusRequest request) {
        CategoryResponse response = categoryService.setActive(id, request.getIsActive());
        return ApiResponse.<CategoryResponse>builder()
                .success(true)
                .message(request.getIsActive() ? "Đã khôi phục danh mục" : "Đã ẩn danh mục")
                .data(response)
                .timestamp(LocalDateTime.now())
                .build();
    }
}
