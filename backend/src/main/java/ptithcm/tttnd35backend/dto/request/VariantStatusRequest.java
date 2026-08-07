package ptithcm.tttnd35backend.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;

/** Dùng cho PATCH .../variants/{variantId}/active - bật/tắt biến thể (soft-delete). */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VariantStatusRequest {

    @NotNull(message = "Thiếu trạng thái active")
    private Boolean active;
}
