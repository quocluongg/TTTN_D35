package ptithcm.tttnd35backend.dto.request;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record HomeFeaturedCategoryRequest(
        @NotNull(message = "Category ID không được để trống")
        UUID categoryId,
        String title,
        Integer sortOrder,
        Boolean isActive
) {}
