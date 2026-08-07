package ptithcm.tttnd35backend.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class BrandLogoResponse {
    private UUID id;
    private String name;
    private String logoUrl;
    private String websiteUrl;
    private int sortOrder;
    private boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
