package ptithcm.tttnd35backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import ptithcm.tttnd35backend.util.enums.WarrantyRepairStatus;

public record WarrantyHistoryRequest(
        @NotBlank(message = "Mô tả lỗi không được để trống")
        String issueDescription,

        String repairAction,
        WarrantyRepairStatus status
) {}
