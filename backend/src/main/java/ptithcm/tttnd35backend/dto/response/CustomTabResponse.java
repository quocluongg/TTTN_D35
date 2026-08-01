package ptithcm.tttnd35backend.dto.response;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.*;

/**
 * content kiểu JsonNode: dữ liệu content là custom  (String, Object)
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomTabResponse {
    private String title;
    private JsonNode content;
}
