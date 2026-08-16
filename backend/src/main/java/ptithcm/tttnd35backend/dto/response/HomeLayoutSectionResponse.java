package ptithcm.tttnd35backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HomeLayoutSectionResponse {
    private UUID id;
    private String sectionKey;
    private String title;
    private String subtitle;
    private int displayOrder;
    private boolean enabled;
    private String layoutStyle;
    private String configJson;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
