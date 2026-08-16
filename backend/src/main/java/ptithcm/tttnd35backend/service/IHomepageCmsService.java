package ptithcm.tttnd35backend.service;

import ptithcm.tttnd35backend.dto.request.*;
import ptithcm.tttnd35backend.dto.response.*;

import java.util.List;
import java.util.UUID;

public interface IHomepageCmsService {

    // Public
    List<HomeBannerResponse> getPublicBanners();
    List<BrandLogoResponse> getPublicBrands();
    List<HomeFeaturedCategoryResponse> getPublicFeaturedCategories();

    // Admin Banners
    List<HomeBannerResponse> getAllBanners();
    HomeBannerResponse getBannerById(UUID id);
    HomeBannerResponse createBanner(HomeBannerRequest request);
    HomeBannerResponse updateBanner(UUID id, HomeBannerRequest request);
    void deleteBanner(UUID id);

    // Admin Brands
    List<BrandLogoResponse> getAllBrands();
    BrandLogoResponse getBrandById(UUID id);
    BrandLogoResponse createBrand(BrandLogoRequest request);
    BrandLogoResponse updateBrand(UUID id, BrandLogoRequest request);
    void deleteBrand(UUID id);

    // Admin Featured Categories
    List<HomeFeaturedCategoryResponse> getAllFeaturedCategories();
    HomeFeaturedCategoryResponse getFeaturedCategoryById(UUID id);
    HomeFeaturedCategoryResponse createFeaturedCategory(HomeFeaturedCategoryRequest request);
    HomeFeaturedCategoryResponse updateFeaturedCategory(UUID id, HomeFeaturedCategoryRequest request);
    void deleteFeaturedCategory(UUID id);

    // Admin Featured Category Items
    HomeFeaturedCategoryItemResponse addFeaturedCategoryItem(UUID featuredCategoryId, HomeFeaturedCategoryItemRequest request);
    void deleteFeaturedCategoryItem(UUID itemId);

    // Homepage Layout Sections
    List<HomeLayoutSectionResponse> getPublicLayout();
    List<HomeLayoutSectionResponse> getAllLayoutSections();
    HomeLayoutSectionResponse createLayoutSection(HomeLayoutSectionRequest request);
    HomeLayoutSectionResponse updateLayoutSection(UUID id, HomeLayoutSectionRequest request);
    void reorderLayoutSections(List<HomeLayoutReorderRequest> requests);
    void deleteLayoutSection(UUID id);
}
