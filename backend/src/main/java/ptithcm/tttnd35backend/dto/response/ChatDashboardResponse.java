package ptithcm.tttnd35backend.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ChatDashboardResponse {
    private long totalConversations;
    private long activeConversations;
    private long handoffConversations;
    private long totalMessages;
    private long flaggedMessages;
    private long needsReviewCount;
    private double avgSessionDurationSeconds;
    private double addToCartRate;
    private double orderConversionRate;
    private long totalOrdersPlaced;
    private long activeKnowledgeBaseVersionCount;
    private long sensitiveQuestionCount;
}