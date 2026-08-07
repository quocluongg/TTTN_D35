package ptithcm.tttnd35backend.dto.response;

import lombok.Builder;
import lombok.Data;
import ptithcm.tttnd35backend.util.enums.FeaturedItemType;

import java.util.UUID;

@Data
@Builder
public class HomeFeaturedCategoryItemResponse {
    private UUID id;
    private UUID featuredCategoryId;
    private FeaturedItemType itemType;
    private UUID productId;
    private String productName;
    private String productThumbnail;
    private UUID brandLogoId;
    private String brandName;
    private String brandLogoUrl;
    private int sortOrder;
}
