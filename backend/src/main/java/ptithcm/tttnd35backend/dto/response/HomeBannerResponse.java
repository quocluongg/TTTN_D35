package ptithcm.tttnd35backend.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class HomeBannerResponse {
    private UUID id;
    private String title;
    private String imageUrl;
    private String linkUrl;
    private int sortOrder;
    private boolean isActive;
    private LocalDateTime startAt;
    private LocalDateTime endAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
