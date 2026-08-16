package ptithcm.tttnd35backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HomeLayoutSectionRequest {

    @NotBlank(message = "sectionKey không được để trống")
    private String sectionKey;

    private String title;
    private String subtitle;
    private int displayOrder;
    private Boolean enabled;
    private String layoutStyle;
    private String configJson;
}
