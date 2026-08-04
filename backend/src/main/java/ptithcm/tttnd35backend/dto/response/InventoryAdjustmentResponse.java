package ptithcm.tttnd35backend.dto.response;

import lombok.Builder;
import lombok.Data;
import ptithcm.tttnd35backend.util.enums.InventoryAdjustReason;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class InventoryAdjustmentResponse {
    private UUID id;
    private UUID variantId;
    private String variantName;
    private int delta;
    private InventoryAdjustReason reason;
    private String note;
    private UUID adjustedById;
    private String adjustedByName;
    private LocalDateTime createdAt;
}
