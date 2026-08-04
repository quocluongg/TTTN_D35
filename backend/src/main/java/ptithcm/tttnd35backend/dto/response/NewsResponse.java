package ptithcm.tttnd35backend.dto.response;

import lombok.Builder;
import lombok.Data;
import ptithcm.tttnd35backend.util.enums.NewsCategory;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class NewsResponse {
    private UUID id;
    private String title;
    private String slug;
    private String excerpt;
    private String content;
    private String thumbnail;
    private NewsCategory category;
    private UUID authorId;
    private String authorName;
    private boolean isPublished;
    private LocalDateTime publishedAt;
    private int viewCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
