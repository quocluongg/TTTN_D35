package ptithcm.tttnd35backend.dto.response;

import lombok.*;
import ptithcm.tttnd35backend.util.enums.DiscountType;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VoucherResponse {
    private UUID id;
    private String code;
    private String description;
    private DiscountType discountType;
    private BigDecimal discountValue;
    private BigDecimal maxDiscountAmount;
    private BigDecimal minOrderValue;
    private Integer maxUsage;
    private Integer maxUsagePerUser;
    private Integer usedCount;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private boolean isActive;
    private boolean currentlyRunning;
}
