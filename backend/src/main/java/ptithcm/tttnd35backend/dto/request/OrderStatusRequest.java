package ptithcm.tttnd35backend.dto.request;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
public record OrderStatusRequest(@NotBlank String status, @Size(max = 1000) String note) { }
