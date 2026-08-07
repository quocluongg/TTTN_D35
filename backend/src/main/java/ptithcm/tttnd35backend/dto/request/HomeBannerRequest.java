package ptithcm.tttnd35backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import java.time.LocalDateTime;

public record HomeBannerRequest(
        String title,
        @NotBlank(message = "URL hình ảnh banner không được để trống")
        String imageUrl,
        String linkUrl,
        Integer sortOrder,
        Boolean isActive,
        LocalDateTime startAt,
        LocalDateTime endAt
) {}
