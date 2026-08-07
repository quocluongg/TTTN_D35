package ptithcm.tttnd35backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductAttributeKeyRequest {

    @NotBlank(message = "Tên key không được để trống")
    private String name;

    private String displayName;

    private String unit;

    @Builder.Default
    private int sortOrder = 0;
}
