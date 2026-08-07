package ptithcm.tttnd35backend.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ptithcm.tttnd35backend.dto.request.*;
import ptithcm.tttnd35backend.dto.response.*;
import ptithcm.tttnd35backend.entity.*;
import ptithcm.tttnd35backend.exception.BadRequestException;
import ptithcm.tttnd35backend.exception.ResourceNotFoundException;
import ptithcm.tttnd35backend.mapper.*;
import ptithcm.tttnd35backend.repository.*;
import ptithcm.tttnd35backend.service.IHomepageCmsService;
import ptithcm.tttnd35backend.util.enums.FeaturedItemType;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class HomepageCmsServiceImpl implements IHomepageCmsService {

    private final IHomeBannerRepository bannerRepository;
    private final IBrandLogoRepository brandRepository;
    private final IHomeFeaturedCategoryRepository featuredCategoryRepository;
    private final IHomeFeaturedCategoryItemRepository featuredItemRepository;
    private final ICategoryRepository categoryRepository;
    private final IProductRepository productRepository;

    private final IHomeBannerMapper bannerMapper;
    private final IBrandLogoMapper brandMapper;
    private final IHomeFeaturedCategoryMapper featuredCategoryMapper;

    @Override
    @Transactional(readOnly = true)
    public List<HomeBannerResponse> getPublicBanners() {
        return bannerMapper.toResponseList(bannerRepository.findActiveBanners(LocalDateTime.now()));
    }

    @Override
    @Transactional(readOnly = true)
    public List<BrandLogoResponse> getPublicBrands() {
        return brandMapper.toResponseList(brandRepository.findByIsActiveTrueOrderBySortOrderAsc());
    }

    @Override
    @Transactional(readOnly = true)
    public List<HomeFeaturedCategoryResponse> getPublicFeaturedCategories() {
        List<HomeFeaturedCategory> categories = featuredCategoryRepository.findByIsActiveTrueOrderBySortOrderAsc();
        return categories.stream().map(fc -> {
            var res = featuredCategoryMapper.toResponse(fc);
            var items = featuredItemRepository.findByFeaturedCategoryIdOrderBySortOrderAsc(fc.getId());
            res.setItems(featuredCategoryMapper.toItemResponseList(items));
            return res;
        }).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<HomeBannerResponse> getAllBanners() {
        return bannerMapper.toResponseList(bannerRepository.findAllByOrderBySortOrderAsc());
    }

    @Override
    @Transactional(readOnly = true)
    public HomeBannerResponse getBannerById(UUID id) {
        var banner = bannerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy banner với id: " + id));
        return bannerMapper.toResponse(banner);
    }

    @Override
    public HomeBannerResponse createBanner(HomeBannerRequest request) {
        HomeBanner banner = bannerMapper.toEntity(request);
        if (request.isActive() != null) {
            banner.setActive(Boolean.TRUE.equals(request.isActive()));
        }
        return bannerMapper.toResponse(bannerRepository.save(banner));
    }

    @Override
    public HomeBannerResponse updateBanner(UUID id, HomeBannerRequest request) {
        HomeBanner banner = bannerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy banner với id: " + id));
        bannerMapper.updateEntityFromRequest(request, banner);
        if (request.isActive() != null) {
            banner.setActive(Boolean.TRUE.equals(request.isActive()));
        }
        return bannerMapper.toResponse(bannerRepository.save(banner));
    }

    @Override
    public void deleteBanner(UUID id) {
        if (!bannerRepository.existsById(id)) {
            throw new ResourceNotFoundException("Không tìm thấy banner với id: " + id);
        }
        bannerRepository.deleteById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BrandLogoResponse> getAllBrands() {
        return brandMapper.toResponseList(brandRepository.findAllByOrderBySortOrderAsc());
    }

    @Override
    @Transactional(readOnly = true)
    public BrandLogoResponse getBrandById(UUID id) {
        var brand = brandRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thương hiệu với id: " + id));
        return brandMapper.toResponse(brand);
    }

    @Override
    public BrandLogoResponse createBrand(BrandLogoRequest request) {
        BrandLogo brand = brandMapper.toEntity(request);
        if (request.isActive() != null) {
            brand.setActive(Boolean.TRUE.equals(request.isActive()));
        }
        return brandMapper.toResponse(brandRepository.save(brand));
    }

    @Override
    public BrandLogoResponse updateBrand(UUID id, BrandLogoRequest request) {
        BrandLogo brand = brandRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thương hiệu với id: " + id));
        brandMapper.updateEntityFromRequest(request, brand);
        if (request.isActive() != null) {
            brand.setActive(Boolean.TRUE.equals(request.isActive()));
        }
        return brandMapper.toResponse(brandRepository.save(brand));
    }

    @Override
    public void deleteBrand(UUID id) {
        if (!brandRepository.existsById(id)) {
            throw new ResourceNotFoundException("Không tìm thấy thương hiệu với id: " + id);
        }
        brandRepository.deleteById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public List<HomeFeaturedCategoryResponse> getAllFeaturedCategories() {
        List<HomeFeaturedCategory> categories = featuredCategoryRepository.findAllByOrderBySortOrderAsc();
        return categories.stream().map(fc -> {
            var res = featuredCategoryMapper.toResponse(fc);
            var items = featuredItemRepository.findByFeaturedCategoryIdOrderBySortOrderAsc(fc.getId());
            res.setItems(featuredCategoryMapper.toItemResponseList(items));
            return res;
        }).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public HomeFeaturedCategoryResponse getFeaturedCategoryById(UUID id) {
        var fc = featuredCategoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục nổi bật với id: " + id));
        var res = featuredCategoryMapper.toResponse(fc);
        var items = featuredItemRepository.findByFeaturedCategoryIdOrderBySortOrderAsc(fc.getId());
        res.setItems(featuredCategoryMapper.toItemResponseList(items));
        return res;
    }

    @Override
    public HomeFeaturedCategoryResponse createFeaturedCategory(HomeFeaturedCategoryRequest request) {
        Category category = categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục với id: " + request.categoryId()));

        HomeFeaturedCategory fc = HomeFeaturedCategory.builder()
                .category(category)
                .title(request.title())
                .sortOrder(request.sortOrder() != null ? request.sortOrder() : 0)
                .isActive(request.isActive() == null || Boolean.TRUE.equals(request.isActive()))
                .build();

        HomeFeaturedCategory saved = featuredCategoryRepository.save(fc);
        var res = featuredCategoryMapper.toResponse(saved);
        res.setItems(List.of());
        return res;
    }

    @Override
    public HomeFeaturedCategoryResponse updateFeaturedCategory(UUID id, HomeFeaturedCategoryRequest request) {
        HomeFeaturedCategory fc = featuredCategoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục nổi bật với id: " + id));

        if (!fc.getCategory().getId().equals(request.categoryId())) {
            Category category = categoryRepository.findById(request.categoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục với id: " + request.categoryId()));
            fc.setCategory(category);
        }

        if (request.title() != null) fc.setTitle(request.title());
        if (request.sortOrder() != null) fc.setSortOrder(request.sortOrder());
        if (request.isActive() != null) fc.setActive(request.isActive());

        HomeFeaturedCategory updated = featuredCategoryRepository.save(fc);
        var res = featuredCategoryMapper.toResponse(updated);
        var items = featuredItemRepository.findByFeaturedCategoryIdOrderBySortOrderAsc(updated.getId());
        res.setItems(featuredCategoryMapper.toItemResponseList(items));
        return res;
    }

    @Override
    public void deleteFeaturedCategory(UUID id) {
        if (!featuredCategoryRepository.existsById(id)) {
            throw new ResourceNotFoundException("Không tìm thấy danh mục nổi bật với id: " + id);
        }
        featuredCategoryRepository.deleteById(id);
    }

    @Override
    public HomeFeaturedCategoryItemResponse addFeaturedCategoryItem(UUID featuredCategoryId, HomeFeaturedCategoryItemRequest request) {
        HomeFeaturedCategory fc = featuredCategoryRepository.findById(featuredCategoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục nổi bật với id: " + featuredCategoryId));

        Product product = null;
        BrandLogo brandLogo = null;

        if (request.itemType() == FeaturedItemType.PRODUCT) {
            if (request.productId() == null) {
                throw new BadRequestException("productId không được để trống khi itemType là PRODUCT");
            }
            product = productRepository.findById(request.productId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm với id: " + request.productId()));
        } else if (request.itemType() == FeaturedItemType.BRAND) {
            if (request.brandLogoId() == null) {
                throw new BadRequestException("brandLogoId không được để trống khi itemType là BRAND");
            }
            brandLogo = brandRepository.findById(request.brandLogoId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thương hiệu với id: " + request.brandLogoId()));
        }

        HomeFeaturedCategoryItem item = HomeFeaturedCategoryItem.builder()
                .featuredCategory(fc)
                .itemType(request.itemType())
                .product(product)
                .brandLogo(brandLogo)
                .sortOrder(request.sortOrder() != null ? request.sortOrder() : 0)
                .build();

        return featuredCategoryMapper.toItemResponse(featuredItemRepository.save(item));
    }

    @Override
    public void deleteFeaturedCategoryItem(UUID itemId) {
        if (!featuredItemRepository.existsById(itemId)) {
            throw new ResourceNotFoundException("Không tìm thấy item nổi bật với id: " + itemId);
        }
        featuredItemRepository.deleteById(itemId);
    }
}
