package ptithcm.tttnd35backend.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;
import ptithcm.tttnd35backend.util.enums.DiscountType;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VoucherRequest {

    @NotBlank(message = "Mã voucher không được để trống")
    @Size(max = 50, message = "Mã voucher tối đa 50 ký tự")
    private String code;

    private String description;

    @NotNull(message = "Vui lòng chọn kiểu giảm giá")
    private DiscountType discountType;

    @NotNull(message = "Giá trị giảm không được để trống")
    @DecimalMin(value = "0", message = "Giá trị giảm phải >= 0")
    private BigDecimal discountValue;

    // Chỉ áp dụng khi discountType = PERCENT, bỏ trống = không giới hạn.
    @DecimalMin(value = "0", message = "Mức giảm tối đa phải >= 0")
    private BigDecimal maxDiscountAmount;

    @Builder.Default
    @DecimalMin(value = "0", message = "Giá trị đơn hàng tối thiểu phải >= 0")
    private BigDecimal minOrderValue = BigDecimal.ZERO;

    // Bỏ trống = không giới hạn tổng lượt dùng.
    @Min(value = 1, message = "Tổng lượt dùng tối đa phải >= 1")
    private Integer maxUsage;

    @Builder.Default
    @Min(value = 1, message = "Lượt dùng tối đa/người phải >= 1")
    private Integer maxUsagePerUser = 1;

    @NotNull(message = "Thời gian bắt đầu không được để trống")
    private LocalDateTime startTime;

    @NotNull(message = "Thời gian kết thúc không được để trống")
    private LocalDateTime endTime;

    @Builder.Default
    private boolean isActive = true;
}
