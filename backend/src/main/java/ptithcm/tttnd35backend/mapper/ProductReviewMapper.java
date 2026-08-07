package ptithcm.tttnd35backend.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import ptithcm.tttnd35backend.dto.request.ProductReviewCreateRequest;
import ptithcm.tttnd35backend.dto.request.ProductReviewUpdateRequest;
import ptithcm.tttnd35backend.dto.response.ProductReviewAdminResponse;
import ptithcm.tttnd35backend.dto.response.ProductReviewResponse;
import ptithcm.tttnd35backend.entity.ProductReview;

import java.util.List;

@Mapper(componentModel = "spring")
public interface ProductReviewMapper {

    // id, productId, orderItemId, profileId, status do Service tự set (validate/enrich từ orderItem).
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "productId", ignore = true)
    @Mapping(target = "orderItemId", ignore = true)
    @Mapping(target = "profileId", ignore = true)
    @Mapping(target = "status", ignore = true)
    ProductReview toEntity(ProductReviewCreateRequest request);

    // @MappingTarget-path -> setter thật, request chỉ có rating/comment/images, tự match theo tên, không cần khai báo gì.
    void updateEntityFromRequest(ProductReviewUpdateRequest request, @MappingTarget ProductReview review);

    // reviewerName do Service gán sau (enrich từ Profile, tránh N+1 khi batch-fetch theo list).
    @Mapping(target = "reviewerName", ignore = true)
    ProductReviewResponse toResponse(ProductReview review);

    List<ProductReviewResponse> toResponseList(List<ProductReview> reviews);

    // reviewerName/reviewerEmail/productName do Service gán sau (enrich, batch-fetch).
    @Mapping(target = "reviewerName", ignore = true)
    @Mapping(target = "reviewerEmail", ignore = true)
    @Mapping(target = "productName", ignore = true)
    ProductReviewAdminResponse toAdminResponse(ProductReview review);

    List<ProductReviewAdminResponse> toAdminResponseList(List<ProductReview> reviews);
}
