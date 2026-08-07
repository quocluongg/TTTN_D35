package ptithcm.tttnd35backend.dto.response;

import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CampaignResponse {
    private UUID id;
    private String name;
    private String description;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private boolean isActive;

    // true nếu is_active=true và thời điểm hiện tại nằm trong [startTime, endTime] - FE dùng để hiện badge "Đang diễn ra".
    private boolean currentlyRunning;
}
