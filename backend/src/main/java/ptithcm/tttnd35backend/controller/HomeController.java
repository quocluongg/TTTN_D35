package ptithcm.tttnd35backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ptithcm.tttnd35backend.dto.response.ApiResponse;
import ptithcm.tttnd35backend.dto.response.BrandLogoResponse;
import ptithcm.tttnd35backend.dto.response.HomeBannerResponse;
import ptithcm.tttnd35backend.dto.response.HomeLayoutSectionResponse;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping({"/api/v1/home", "/home"})
@RequiredArgsConstructor
public class HomeController {

    private final IHomepageCmsService cmsService;

    @GetMapping("/layout")
    public ApiResponse<List<HomeLayoutSectionResponse>> getLayout() {
        return ApiResponse.<List<HomeLayoutSectionResponse>>builder()
                .success(true)
                .data(cmsService.getPublicLayout())
                .timestamp(LocalDateTime.now())
                .build();
    }

    @GetMapping("/banners")
    public ApiResponse<List<HomeBannerResponse>> getBanners() {
        return ApiResponse.<List<HomeBannerResponse>>builder()
                .success(true)
                .data(cmsService.getPublicBanners())
                .timestamp(LocalDateTime.now())
                .build();
    }

    @GetMapping("/brands")
    public ApiResponse<List<BrandLogoResponse>> getBrands() {
        return ApiResponse.<List<BrandLogoResponse>>builder()
                .success(true)
                .data(cmsService.getPublicBrands())
                .timestamp(LocalDateTime.now())
                .build();
    }

    @GetMapping("/featured-categories")
    public ApiResponse<List<HomeFeaturedCategoryResponse>> getFeaturedCategories() {
        return ApiResponse.<List<HomeFeaturedCategoryResponse>>builder()
                .success(true)
                .data(cmsService.getPublicFeaturedCategories())
                .timestamp(LocalDateTime.now())
                .build();
    }
}
/*
 * Example cURL:
 * 1. GET /api/v1/home/banners
 * curl -X GET "http://localhost:8080/api/v1/home/banners"
 *
 * 2. GET /api/v1/home/brands
 * curl -X GET "http://localhost:8080/api/v1/home/brands"
 */
