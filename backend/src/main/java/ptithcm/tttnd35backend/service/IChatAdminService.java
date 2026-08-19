package ptithcm.tttnd35backend.service;

import org.springframework.data.domain.Pageable;
import ptithcm.tttnd35backend.dto.request.FlagUpdateRequest;
import ptithcm.tttnd35backend.dto.request.KnowledgeBaseVersionRequest;
import ptithcm.tttnd35backend.dto.request.SensitiveQuestionRequest;
import ptithcm.tttnd35backend.dto.request.TakeoverRequest;
import ptithcm.tttnd35backend.dto.response.*;
import ptithcm.tttnd35backend.dto.response.pagination.PageResponse;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface IChatAdminService {

    PageResponse<ChatConversationResponse> getConversations(String search, String status, String source,
                                                             LocalDateTime from, LocalDateTime to, Pageable pageable);

    ChatConversationResponse getConversationDetail(UUID conversationId);

    PageResponse<ChatMessageResponse> getMessages(UUID conversationId, Pageable pageable);

    ChatMessageResponse flagMessage(UUID messageId, FlagUpdateRequest request);

    ChatConversationResponse takeover(UUID conversationId, UUID staffId, TakeoverRequest request);

    ChatConversationResponse closeConversation(UUID conversationId);

    ChatDashboardResponse getDashboard(LocalDateTime from, LocalDateTime to);

    List<ChatStatPointResponse> getUserStats(LocalDateTime from, LocalDateTime to, String groupBy);

    List<ChatTopProductResponse> getTopProductsAsked(int limit);

    List<ChatTopQuestionResponse> getTopQuestionsByCategory(int limit);

    List<ChatKbEffectivenessResponse> getKbEffectiveness();

    List<SensitiveQuestionResponse> getSensitiveQuestions(String search, Boolean isActive);

    SensitiveQuestionResponse createSensitiveQuestion(SensitiveQuestionRequest request);

    SensitiveQuestionResponse updateSensitiveQuestion(UUID id, SensitiveQuestionRequest request);

    void deleteSensitiveQuestion(UUID id);

    List<KnowledgeBaseVersionResponse> getKnowledgeBaseVersions();

    KnowledgeBaseVersionResponse createKnowledgeBaseVersion(KnowledgeBaseVersionRequest request);
}