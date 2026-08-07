package ptithcm.tttnd35backend.dto.response;

import lombok.Builder;
import lombok.Data;
import ptithcm.tttnd35backend.util.enums.WarrantyStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class WarrantyCardResponse {
    private UUID id;
    private UUID orderId;
    private UUID orderItemId;
    private String customerName;
    private String customerPhone;
    private String customerEmail;
    private String productName;
    private String serialNumber;
    private LocalDate purchaseDate;
    private int warrantyMonths;
    private LocalDate expiryDate;
    private WarrantyStatus status;
    private String notes;
    private UUID createdById;
    private String createdByName;
    private List<WarrantyHistoryResponse> histories;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
