package ptithcm.tttnd35backend.dto.request;

import jakarta.validation.constraints.NotNull;
import ptithcm.tttnd35backend.util.enums.InventoryAdjustReason;

public record InventoryAdjustmentRequest(
        @NotNull(message = "Số lượng thay đổi (delta) không được để trống")
        Integer delta,

        @NotNull(message = "Lý do điều chỉnh không được để trống")
        InventoryAdjustReason reason,

        String note
) {}
