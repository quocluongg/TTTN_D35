package ptithcm.tttnd35backend.dto.response;

import lombok.Builder;
import lombok.Data;
import ptithcm.tttnd35backend.util.enums.WarrantyRepairStatus;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class WarrantyHistoryResponse {
    private UUID id;
    private UUID warrantyCardId;
    private LocalDateTime requestDate;
    private String issueDescription;
    private String repairAction;
    private WarrantyRepairStatus status;
    private UUID handledById;
    private String handledByName;
    private LocalDateTime completedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
