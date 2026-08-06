package ptithcm.tttnd35backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import ptithcm.tttnd35backend.dto.request.ProductAttributeKeyRequest;
import ptithcm.tttnd35backend.dto.response.ApiResponse;
import ptithcm.tttnd35backend.dto.response.ProductAttributeKeyResponse;
import ptithcm.tttnd35backend.service.IProductAttributeKeyService;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/admin/product-attribute-keys")
@RequiredArgsConstructor
public class AdminProductAttributeKeyController {

    private final IProductAttributeKeyService attributeKeyService;

    @GetMapping
    @PreAuthorize("hasAuthority('PRODUCT_UPDATE')")
    public ApiResponse<List<ProductAttributeKeyResponse>> getAll() {
        return ApiResponse.<List<ProductAttributeKeyResponse>>builder()
                .success(true)
                .data(attributeKeyService.getAll())
                .timestamp(LocalDateTime.now())
                .build();
    }

    @PostMapping
    @PreAuthorize("hasAuthority('PRODUCT_UPDATE')")
    public ApiResponse<ProductAttributeKeyResponse> create(@RequestBody @Valid ProductAttributeKeyRequest request) {
        return ApiResponse.<ProductAttributeKeyResponse>builder()
                .success(true)
                .message("Tạo attribute key thành công")
                .data(attributeKeyService.create(request))
                .timestamp(LocalDateTime.now())
                .build();
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('PRODUCT_UPDATE')")
    public ApiResponse<ProductAttributeKeyResponse> update(
            @PathVariable Integer id, @RequestBody @Valid ProductAttributeKeyRequest request) {
        return ApiResponse.<ProductAttributeKeyResponse>builder()
                .success(true)
                .message("Cập nhật attribute key thành công")
                .data(attributeKeyService.update(id, request))
                .timestamp(LocalDateTime.now())
                .build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('PRODUCT_UPDATE')")
    public ApiResponse<?> delete(@PathVariable Integer id) {
        attributeKeyService.delete(id);
        return ApiResponse.builder()
                .success(true)
                .message("Xóa attribute key thành công")
                .timestamp(LocalDateTime.now())
                .build();
    }
}
