package ptithcm.tttnd35backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import ptithcm.tttnd35backend.dto.request.*;
import ptithcm.tttnd35backend.dto.response.*;
import ptithcm.tttnd35backend.service.IHomepageCmsService;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/admin/home")
@RequiredArgsConstructor
public class AdminHomeController {

    private final IHomepageCmsService cmsService;

    // --- Banners ---
    @GetMapping("/banners")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('HOMEPAGE_CMS_MANAGE')")
    public ApiResponse<List<HomeBannerResponse>> getAllBanners() {
        return ApiResponse.<List<HomeBannerResponse>>builder()
                .success(true)
                .data(cmsService.getAllBanners())
                .timestamp(LocalDateTime.now())
                .build();
    }

    @GetMapping("/banners/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('HOMEPAGE_CMS_MANAGE')")
    public ApiResponse<HomeBannerResponse> getBannerById(@PathVariable UUID id) {
        return ApiResponse.<HomeBannerResponse>builder()
                .success(true)
                .data(cmsService.getBannerById(id))
                .timestamp(LocalDateTime.now())
                .build();
    }

    @PostMapping("/banners")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('HOMEPAGE_CMS_MANAGE')")
    public ApiResponse<HomeBannerResponse> createBanner(@RequestBody @Valid HomeBannerRequest request) {
        return ApiResponse.<HomeBannerResponse>builder()
                .success(true)
                .message("Tạo banner thành công")
                .data(cmsService.createBanner(request))
                .timestamp(LocalDateTime.now())
                .build();
    }

    @PutMapping("/banners/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('HOMEPAGE_CMS_MANAGE')")
    public ApiResponse<HomeBannerResponse> updateBanner(@PathVariable UUID id, @RequestBody @Valid HomeBannerRequest request) {
        return ApiResponse.<HomeBannerResponse>builder()
                .success(true)
                .message("Cập nhật banner thành công")
                .data(cmsService.updateBanner(id, request))
                .timestamp(LocalDateTime.now())
                .build();
    }

    @DeleteMapping("/banners/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('HOMEPAGE_CMS_MANAGE')")
    public ApiResponse<Void> deleteBanner(@PathVariable UUID id) {
        cmsService.deleteBanner(id);
        return ApiResponse.<Void>builder()
                .success(true)
                .message("Xóa banner thành công")
                .timestamp(LocalDateTime.now())
                .build();
    }

    // --- Brands ---
    @GetMapping("/brands")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('HOMEPAGE_CMS_MANAGE')")
    public ApiResponse<List<BrandLogoResponse>> getAllBrands() {
        return ApiResponse.<List<BrandLogoResponse>>builder()
                .success(true)
                .data(cmsService.getAllBrands())
                .timestamp(LocalDateTime.now())
                .build();
    }

    @GetMapping("/brands/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('HOMEPAGE_CMS_MANAGE')")
    public ApiResponse<BrandLogoResponse> getBrandById(@PathVariable UUID id) {
        return ApiResponse.<BrandLogoResponse>builder()
                .success(true)
                .data(cmsService.getBrandById(id))
                .timestamp(LocalDateTime.now())
                .build();
    }

    @PostMapping("/brands")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('HOMEPAGE_CMS_MANAGE')")
    public ApiResponse<BrandLogoResponse> createBrand(@RequestBody @Valid BrandLogoRequest request) {
        return ApiResponse.<BrandLogoResponse>builder()
                .success(true)
                .message("Tạo thương hiệu thành công")
                .data(cmsService.createBrand(request))
                .timestamp(LocalDateTime.now())
                .build();
    }

    @PutMapping("/brands/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('HOMEPAGE_CMS_MANAGE')")
    public ApiResponse<BrandLogoResponse> updateBrand(@PathVariable UUID id, @RequestBody @Valid BrandLogoRequest request) {
        return ApiResponse.<BrandLogoResponse>builder()
                .success(true)
                .message("Cập nhật thương hiệu thành công")
                .data(cmsService.updateBrand(id, request))
                .timestamp(LocalDateTime.now())
                .build();
    }

    @DeleteMapping("/brands/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('HOMEPAGE_CMS_MANAGE')")
    public ApiResponse<Void> deleteBrand(@PathVariable UUID id) {
        cmsService.deleteBrand(id);
        return ApiResponse.<Void>builder()
                .success(true)
                .message("Xóa thương hiệu thành công")
                .timestamp(LocalDateTime.now())
                .build();
    }

    // --- Featured Categories ---
    @GetMapping("/featured-categories")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('HOMEPAGE_CMS_MANAGE')")
    public ApiResponse<List<HomeFeaturedCategoryResponse>> getAllFeaturedCategories() {
        return ApiResponse.<List<HomeFeaturedCategoryResponse>>builder()
                .success(true)
                .data(cmsService.getAllFeaturedCategories())
                .timestamp(LocalDateTime.now())
                .build();
    }

    @GetMapping("/featured-categories/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('HOMEPAGE_CMS_MANAGE')")
    public ApiResponse<HomeFeaturedCategoryResponse> getFeaturedCategoryById(@PathVariable UUID id) {
        return ApiResponse.<HomeFeaturedCategoryResponse>builder()
                .success(true)
                .data(cmsService.getFeaturedCategoryById(id))
                .timestamp(LocalDateTime.now())
                .build();
    }

    @PostMapping("/featured-categories")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('HOMEPAGE_CMS_MANAGE')")
    public ApiResponse<HomeFeaturedCategoryResponse> createFeaturedCategory(@RequestBody @Valid HomeFeaturedCategoryRequest request) {
        return ApiResponse.<HomeFeaturedCategoryResponse>builder()
                .success(true)
                .message("Tạo danh mục nổi bật thành công")
                .data(cmsService.createFeaturedCategory(request))
                .timestamp(LocalDateTime.now())
                .build();
    }

    @PutMapping("/featured-categories/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('HOMEPAGE_CMS_MANAGE')")
    public ApiResponse<HomeFeaturedCategoryResponse> updateFeaturedCategory(@PathVariable UUID id, @RequestBody @Valid HomeFeaturedCategoryRequest request) {
        return ApiResponse.<HomeFeaturedCategoryResponse>builder()
                .success(true)
                .message("Cập nhật danh mục nổi bật thành công")
                .data(cmsService.updateFeaturedCategory(id, request))
                .timestamp(LocalDateTime.now())
                .build();
    }

    @DeleteMapping("/featured-categories/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('HOMEPAGE_CMS_MANAGE')")
    public ApiResponse<Void> deleteFeaturedCategory(@PathVariable UUID id) {
        cmsService.deleteFeaturedCategory(id);
        return ApiResponse.<Void>builder()
                .success(true)
                .message("Xóa danh mục nổi bật thành công")
                .timestamp(LocalDateTime.now())
                .build();
    }

    // --- Featured Category Items ---
    @PostMapping("/featured-categories/{id}/items")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('HOMEPAGE_CMS_MANAGE')")
    public ApiResponse<HomeFeaturedCategoryItemResponse> addItem(
            @PathVariable UUID id,
            @RequestBody @Valid HomeFeaturedCategoryItemRequest request
    ) {
        return ApiResponse.<HomeFeaturedCategoryItemResponse>builder()
                .success(true)
                .message("Ghim item vào danh mục thành công")
                .data(cmsService.addFeaturedCategoryItem(id, request))
                .timestamp(LocalDateTime.now())
                .build();
    }

    @DeleteMapping("/featured-categories/items/{itemId}")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('HOMEPAGE_CMS_MANAGE')")
    public ApiResponse<Void> deleteItem(@PathVariable UUID itemId) {
        cmsService.deleteFeaturedCategoryItem(itemId);
        return ApiResponse.<Void>builder()
                .success(true)
                .message("Xóa item khỏi danh mục nổi bật thành công")
                .timestamp(LocalDateTime.now())
                .build();
    }

    // --- Layout Sections ---
    @GetMapping("/layout")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('HOMEPAGE_CMS_MANAGE')")
    public ApiResponse<List<HomeLayoutSectionResponse>> getAllLayoutSections() {
        return ApiResponse.<List<HomeLayoutSectionResponse>>builder()
                .success(true)
                .data(cmsService.getAllLayoutSections())
                .timestamp(LocalDateTime.now())
                .build();
    }

    @PostMapping("/layout")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('HOMEPAGE_CMS_MANAGE')")
    public ApiResponse<HomeLayoutSectionResponse> createLayoutSection(@RequestBody @Valid HomeLayoutSectionRequest request) {
        return ApiResponse.<HomeLayoutSectionResponse>builder()
                .success(true)
                .message("Tạo layout section thành công")
                .data(cmsService.createLayoutSection(request))
                .timestamp(LocalDateTime.now())
                .build();
    }

    @PutMapping("/layout/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('HOMEPAGE_CMS_MANAGE')")
    public ApiResponse<HomeLayoutSectionResponse> updateLayoutSection(
            @PathVariable UUID id,
            @RequestBody @Valid HomeLayoutSectionRequest request
    ) {
        return ApiResponse.<HomeLayoutSectionResponse>builder()
                .success(true)
                .message("Cập nhật layout section thành công")
                .data(cmsService.updateLayoutSection(id, request))
                .timestamp(LocalDateTime.now())
                .build();
    }

    @PutMapping("/layout/reorder")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('HOMEPAGE_CMS_MANAGE')")
    public ApiResponse<Void> reorderLayoutSections(@RequestBody List<HomeLayoutReorderRequest> requests) {
        cmsService.reorderLayoutSections(requests);
        return ApiResponse.<Void>builder()
                .success(true)
                .message("Cập nhật thứ tự layout thành công")
                .timestamp(LocalDateTime.now())
                .build();
    }

    @DeleteMapping("/layout/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('HOMEPAGE_CMS_MANAGE')")
    public ApiResponse<Void> deleteLayoutSection(@PathVariable UUID id) {
        cmsService.deleteLayoutSection(id);
        return ApiResponse.<Void>builder()
                .success(true)
                .message("Xóa layout section thành công")
                .timestamp(LocalDateTime.now())
                .build();
    }
}
