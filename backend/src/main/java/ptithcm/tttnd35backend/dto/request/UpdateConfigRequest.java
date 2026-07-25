package ptithcm.tttnd35backend.dto.request;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
public record UpdateConfigRequest(@NotBlank @Size(max = 10000) String value) { }
