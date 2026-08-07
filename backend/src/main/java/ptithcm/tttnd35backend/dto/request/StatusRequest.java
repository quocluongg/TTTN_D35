package ptithcm.tttnd35backend.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;

/** Dùng cho PATCH .../status của Category và Product (ẩn/khôi phục). */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StatusRequest {

    @NotNull(message = "Thiếu trạng thái isActive")
    private Boolean isActive;
}
