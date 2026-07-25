package ptithcm.tttnd35backend.dto.request;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
public record PromotionRequest(@NotBlank @Size(max=80) String code, @NotBlank @Size(max=255) String name,
    @Pattern(regexp="PERCENT|FIXED") String discountType, @NotNull @DecimalMin("0") BigDecimal discountValue,
    @DecimalMin("0") BigDecimal maxDiscountAmount, @DecimalMin("0") BigDecimal minimumOrderAmount,
    @PositiveOrZero Integer usageLimit, @NotNull LocalDateTime startsAt, @NotNull LocalDateTime endsAt, Boolean active) { }
