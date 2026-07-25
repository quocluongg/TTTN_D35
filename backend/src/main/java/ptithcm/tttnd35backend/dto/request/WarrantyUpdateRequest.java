package ptithcm.tttnd35backend.dto.request;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
public record WarrantyUpdateRequest(@NotBlank String status, @NotBlank String description, String resolution,
                                    @DecimalMin("0") BigDecimal extraCost, LocalDateTime expectedReturnAt) { }
