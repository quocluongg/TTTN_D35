package ptithcm.tttnd35backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomTabRequest {

    @NotBlank(message = "Tiêu đề tab không được để trống")
    private String title;

    @NotBlank(message = "Nội dung tab không được để trống")
    private String content;
}
