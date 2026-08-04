package ptithcm.tttnd35backend.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class HomeFeaturedCategoryResponse {
    private UUID id;
    private UUID categoryId;
    private String categoryName;
    private String categorySlug;
    private String title;
    private int sortOrder;
    private boolean isActive;
    private List<HomeFeaturedCategoryItemResponse> items;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
