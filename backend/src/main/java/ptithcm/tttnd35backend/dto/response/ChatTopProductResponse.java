package ptithcm.tttnd35backend.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class ChatTopProductResponse {
    private UUID productId;
    private String productName;
    private long mentionCount;
    private long orderCount;
}