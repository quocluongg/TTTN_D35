package ptithcm.tttnd35backend.dto.request;

import jakarta.validation.constraints.NotNull;
import ptithcm.tttnd35backend.util.enums.FeaturedItemType;

import java.util.UUID;

public record HomeFeaturedCategoryItemRequest(
        @NotNull(message = "Loại item không được để trống")
        FeaturedItemType itemType,

        UUID productId,
        UUID brandLogoId,
        Integer sortOrder
) {}
