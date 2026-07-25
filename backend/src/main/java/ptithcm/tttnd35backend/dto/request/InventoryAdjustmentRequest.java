package ptithcm.tttnd35backend.dto.request;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
public record InventoryAdjustmentRequest(@NotNull Integer quantityDelta, @NotBlank String reason) { }
