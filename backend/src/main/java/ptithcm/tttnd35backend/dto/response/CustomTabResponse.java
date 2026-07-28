package ptithcm.tttnd35backend.dto.response;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomTabResponse {
    private String title;
    private String content;
}
