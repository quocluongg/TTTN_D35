package ptithcm.tttnd35backend.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import ptithcm.tttnd35backend.dto.request.ProductAdminRequest;
import ptithcm.tttnd35backend.dto.request.ProductVariantAdminRequest;
import ptithcm.tttnd35backend.dto.response.ProductDetailResponse;
import ptithcm.tttnd35backend.dto.response.ProductImageResponse;
import ptithcm.tttnd35backend.dto.response.ProductListItemResponse;
import ptithcm.tttnd35backend.dto.response.ProductVariantResponse;
import ptithcm.tttnd35backend.dto.response.pagination.PageResponse;
import ptithcm.tttnd35backend.entity.Category;
import ptithcm.tttnd35backend.entity.Product;
import ptithcm.tttnd35backend.entity.ProductImage;
import ptithcm.tttnd35backend.entity.ProductVariant;
import ptithcm.tttnd35backend.exception.BadRequestException;
import ptithcm.tttnd35backend.exception.ResourceNotFoundException;
import ptithcm.tttnd35backend.mapper.ProductImageMapper;
import ptithcm.tttnd35backend.mapper.ProductMapper;
import ptithcm.tttnd35backend.mapper.ProductVariantMapper;
import ptithcm.tttnd35backend.repository.ICategoryRepository;
import ptithcm.tttnd35backend.repository.IProductImageRepository;
import ptithcm.tttnd35backend.repository.IProductRepository;
import ptithcm.tttnd35backend.repository.IProductVariantRepository;
import ptithcm.tttnd35backend.repository.projection.ProductMinPriceProjection;
import ptithcm.tttnd35backend.repository.spec.ProductSpecifications;
import ptithcm.tttnd35backend.service.ICategoryService;
import ptithcm.tttnd35backend.service.IProductService;
import ptithcm.tttnd35backend.service.IStorageService;
import ptithcm.tttnd35backend.util.helper.CustomTabJsonUtil;
import ptithcm.tttnd35backend.util.helper.PageResponseHelper;
import ptithcm.tttnd35backend.util.helper.SlugUtils;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements IProductService {

    private final IProductRepository productRepository;
    private final IProductImageRepository productImageRepository;
    private final IProductVariantRepository productVariantRepository;
    private final ICategoryRepository categoryRepository;

    private final ProductMapper productMapper;
    private final ProductImageMapper productImageMapper;
    private final ProductVariantMapper productVariantMapper;

    private final ICategoryService categoryService;
    private final IStorageService storageService;

    // ===== Đọc (public + admin) =====

    @Override
    public PageResponse<ProductListItemResponse> getList(
            String categorySlug, String brand, BigDecimal minPrice, BigDecimal maxPrice,
            String search, String sortBy, int page, int size) {
        return buildPageResponse(true, categorySlug, brand, minPrice, maxPrice, search, sortBy, page, size);
    }

    @Override
    public PageResponse<ProductListItemResponse> getListForAdmin(
            String categorySlug, String brand, BigDecimal minPrice, BigDecimal maxPrice,
            String search, String sortBy, int page, int size) {
        return buildPageResponse(false, categorySlug, brand, minPrice, maxPrice, search, sortBy, page, size);
    }

    private PageResponse<ProductListItemResponse> buildPageResponse(
            boolean onlyActive, String categorySlug, String brand, BigDecimal minPrice, BigDecimal maxPrice,
            String search, String sortBy, int page, int size) {

        // Sort theo giá không diễn đạt được bằng Pageable Sort thường (giá nằm ở bảng ProductVariant,
        // không phải cột trên Product) nên phải set trực tiếp query.orderBy() trong Specification -
        // vì vậy 2 nhánh này tách Pageable riêng: có Sort.unsorted() khi order đã do Specification lo.
        boolean sortByPrice = "price-asc".equals(sortBy) || "price-desc".equals(sortBy);

        Specification<Product> spec = Specification.allOf(
                onlyActive ? ProductSpecifications.isActive() : Specification.allOf(),
                nonNull(ProductSpecifications.hasCategorySlug(categorySlug)),
                nonNull(ProductSpecifications.hasBrand(brand)),
                nonNull(ProductSpecifications.nameContains(search)),
                nonNull(ProductSpecifications.priceFromBetween(minPrice, maxPrice)),
                sortByPrice ? ProductSpecifications.orderByMinPrice("price-asc".equals(sortBy)) : Specification.allOf()
        );

        Pageable pageable = PageRequest.of(page, size, sortByPrice ? Sort.unsorted() : resolveSort(sortBy));
        var pageResult = productRepository.findAll(spec, pageable);

        // 1 query aggregate MIN(price) duy nhất cho cả trang, tránh N+1 khi build priceFrom từng dòng.
        List<UUID> productIds = pageResult.getContent().stream().map(Product::getId).toList();
        Map<UUID, BigDecimal> minPriceByProductId = new LinkedHashMap<>();
        if (!productIds.isEmpty()) {
            for (ProductMinPriceProjection projection : productVariantRepository.findMinPriceByProductIds(productIds)) {
                minPriceByProductId.put(projection.getProductId(), projection.getMinPrice());
            }
        }

        var items = pageResult.map(product -> {
            ProductListItemResponse item = productMapper.toListItem(product);
            item.setPriceFrom(minPriceByProductId.get(product.getId()));
            return item;
        });

        return PageResponseHelper.toPageResponse(items);
    }

    private Specification<Product> nonNull(Specification<Product> spec) {
        return spec == null ? Specification.allOf() : spec;
    }

    private Sort resolveSort(String sortBy) {
        if (!StringUtils.hasText(sortBy)) {
            return Sort.by(Sort.Direction.DESC, "createdAt");
        }
        // "price-asc"/"price-desc" được xử lý riêng ở buildPageResponse() qua Specification, không tới đây.
        return switch (sortBy) {
            case "name-asc" -> Sort.by(Sort.Direction.ASC, "name");
            case "name-desc" -> Sort.by(Sort.Direction.DESC, "name");
            default -> Sort.by(Sort.Direction.DESC, "createdAt"); // "newest" hoặc không truyền
        };
    }

    @Override
    public ProductDetailResponse getDetailBySlug(String slug) {
        Product product = productRepository.findBySlugAndIsActiveTrue(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm"));
        return buildDetailResponse(product);
    }

    @Override
    public ProductDetailResponse getDetailById(UUID id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm"));
        return buildDetailResponse(product);
    }

    private ProductDetailResponse buildDetailResponse(Product product) {
        // 3 query cố định (product+category đã fetch join sẵn, +variants, +images) - không N+1 dù
        // sản phẩm có bao nhiêu variant/ảnh.
        ProductDetailResponse response = productMapper.toDetailResponse(product);
        response.setCustomTabs(CustomTabJsonUtil.toResponseList(product.getCustomTabs()));
        response.setCategoryBreadcrumb(categoryService.getBreadcrumb(product.getCategory().getSlug()));
        response.setVariants(productVariantMapper.toResponseList(
                productVariantRepository.findAllByProductId(product.getId())));
        response.setImages(productImageMapper.toResponseList(
                productImageRepository.findAllByProductIdOrderBySortOrderAsc(product.getId())));
        return response;
    }

    // ===== Ghi (admin) =====

    @Override
    @Transactional
    public ProductDetailResponse create(ProductAdminRequest request) {
        Category category = loadLeafCategory(request.getCategoryId());

        Product product = productMapper.toEntity(request);
        product.setSlug(generateUniqueProductSlug(request.getName()));
        product.setCategory(category);
        product.setCustomTabs(CustomTabJsonUtil.buildFromRequests(request.getCustomTabs()));
        product.setActive(true);
        product = productRepository.save(product);

        for (ProductVariantAdminRequest variantRequest : request.getVariants()) {
            saveNewVariant(product, category, variantRequest);
        }

        return buildDetailResponse(product);
    }

    @Override
    @Transactional
    public ProductDetailResponse update(UUID id, ProductAdminRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm"));

        Category category = loadLeafCategory(request.getCategoryId());

        // Giữ nguyên slug cũ khi sửa (chuẩn SEO, giống Category) - không sinh lại slug ở update.
        productMapper.updateEntityFromRequest(request, product);
        product.setCategory(category);
        product.setCustomTabs(CustomTabJsonUtil.buildFromRequests(request.getCustomTabs()));

        return buildDetailResponse(productRepository.save(product));
    }

    @Override
    @Transactional
    public ProductDetailResponse setActive(UUID id, boolean active) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm"));
        product.setActive(active);
        return buildDetailResponse(productRepository.save(product));
    }

    // ===== Ảnh =====

    @Override
    @Transactional
    public List<ProductImageResponse> addImages(UUID productId, List<MultipartFile> files) {
        Product product = getOwnedProduct(productId);

        long nextSortOrder = productImageRepository.countByProductId(productId);
        List<ProductImage> saved = new ArrayList<>();
        for (MultipartFile file : files) {
            String url = storageService.upload("products/" + product.getId(), file);
            ProductImage image = ProductImage.builder()
                    .productId(product.getId())
                    .url(url)
                    .sortOrder((int) nextSortOrder++)
                    .build();
            saved.add(productImageRepository.save(image));
        }
        return productImageMapper.toResponseList(saved);
    }

    @Override
    @Transactional
    public void deleteImage(UUID productId, UUID imageId) {
        ProductImage image = productImageRepository.findByIdAndProductId(imageId, productId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy ảnh"));
        // Xóa DB record trước, Storage sau: nếu có crash/lỗi giữa chừng, tệ nhất là rác 1 file mồ côi
        // trên bucket (âm thầm, dọn sau cũng được) - còn hơn để DB trỏ tới ảnh đã mất, hiển thị vỡ ra UI.
        productImageRepository.delete(image);
        storageService.delete(image.getUrl());
    }

    // ===== Variant =====

    @Override
    @Transactional
    public ProductVariantResponse addVariant(UUID productId, ProductVariantAdminRequest request) {
        Product product = getOwnedProduct(productId);
        return productVariantMapper.toResponse(saveNewVariant(product, product.getCategory(), request));
    }

    @Override
    @Transactional
    public ProductVariantResponse updateVariant(UUID productId, UUID variantId, ProductVariantAdminRequest request) {
        getOwnedProduct(productId);
        ProductVariant variant = productVariantRepository.findByIdAndProductId(variantId, productId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy biến thể"));

        productVariantMapper.updateEntityFromRequest(request, variant);
        variant.setVariantName(buildVariantName(request.getAttributes()));

        return productVariantMapper.toResponse(productVariantRepository.save(variant));
    }

    @Override
    @Transactional
    public void deleteVariant(UUID productId, UUID variantId) {
        getOwnedProduct(productId);
        ProductVariant variant = productVariantRepository.findByIdAndProductId(variantId, productId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy biến thể"));

        // Mỗi Product luôn phải có >= 1 variant vì Order/Cart/Campaign tham chiếu thẳng variant_id.
        if (productVariantRepository.countByProductId(productId) <= 1) {
            throw new BadRequestException("Sản phẩm phải có ít nhất 1 biến thể, không thể xóa biến thể cuối cùng");
        }

        productVariantRepository.delete(variant);
    }

    // ===== Helper dùng chung =====

    private Product getOwnedProduct(UUID productId) {
        return productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm"));
    }

    private Category loadLeafCategory(UUID categoryId) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new BadRequestException("Danh mục không tồn tại"));
        // Chỉ cho gắn sản phẩm vào danh mục lá (không có danh mục con), giống các site bán lẻ thật.
        if (categoryRepository.existsByParentId(category.getId())) {
            throw new BadRequestException("Chỉ được gán sản phẩm vào danh mục lá (không có danh mục con)");
        }
        return category;
    }

    private ProductVariant saveNewVariant(Product product, Category category, ProductVariantAdminRequest request) {
        ProductVariant variant = productVariantMapper.toEntity(request);
        variant.setProductId(product.getId());
        variant.setVariantName(buildVariantName(request.getAttributes()));
        variant.setSku(generateSku(category));
        return productVariantRepository.save(variant);
    }

    // BE tự build variant_name từ attributes (vd {"color":"Đen","storage":"256GB"} -> "Đen - 256GB")
    // để FE khỏi phải tự parse jsonb. Rỗng -> null (variant mặc định không có tùy chọn).
    private String buildVariantName(Map<String, String> attributes) {
        if (attributes == null || attributes.isEmpty()) {
            return null;
        }
        String joined = attributes.values().stream()
                .filter(StringUtils::hasText)
                .reduce((a, b) -> a + " - " + b)
                .orElse(null);
        return StringUtils.hasText(joined) ? joined : null;
    }

    // SKU dạng {3 ký tự đầu category slug viết hoa}-{sequence 6 số tăng dần toàn hệ thống},
    // sequence lấy từ Postgres SEQUENCE (không phải COUNT(*)) để an toàn khi nhiều admin tạo cùng lúc.
    private String generateSku(Category category) {
        String prefix = SlugUtils.toShortPrefix(category.getSlug(), 3);
        long seq = productVariantRepository.nextSkuSequenceValue();
        String sku = prefix + "-" + String.format("%06d", seq);

        // Cực hiếm khi trùng vì dùng sequence riêng, nhưng vẫn phòng hờ 1 lần retry.
        if (productVariantRepository.existsBySku(sku)) {
            long retrySeq = productVariantRepository.nextSkuSequenceValue();
            sku = prefix + "-" + String.format("%06d", retrySeq);
        }
        return sku;
    }

    private String generateUniqueProductSlug(String name) {
        String base = SlugUtils.toSlug(name);
        String slug = base;
        int suffix = 2;
        while (productRepository.existsBySlug(slug)) {
            slug = base + "-" + suffix++;
        }
        return slug;
    }
}
