package ptithcm.tttnd35backend.rag.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RagSourceDto {
    private String productId;
    private String title;
    private String url;
    private String snippet;
}
