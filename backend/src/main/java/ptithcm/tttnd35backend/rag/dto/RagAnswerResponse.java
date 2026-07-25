package ptithcm.tttnd35backend.rag.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RagAnswerResponse {
    private String answer;
    private BigDecimal confidence;
    private List<RagSourceDto> sources;
    private List<Object> suggestedProducts;
    private UUID conversationId;
    private UUID messageId;
    private String provider;
}
