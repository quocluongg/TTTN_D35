package ptithcm.tttnd35backend.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ChatTopQuestionResponse {
    private String category;
    private long questionCount;
    private double percentage;
}