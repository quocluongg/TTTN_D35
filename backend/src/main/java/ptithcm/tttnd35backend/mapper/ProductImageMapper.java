package ptithcm.tttnd35backend.mapper;

import org.mapstruct.Mapper;
import ptithcm.tttnd35backend.dto.response.ProductImageResponse;
import ptithcm.tttnd35backend.entity.ProductImage;

import java.util.List;

@Mapper(componentModel = "spring")
public interface ProductImageMapper {

    ProductImageResponse toResponse(ProductImage image);

    List<ProductImageResponse> toResponseList(List<ProductImage> images);
}
