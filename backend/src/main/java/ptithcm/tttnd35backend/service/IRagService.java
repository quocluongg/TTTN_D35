package ptithcm.tttnd35backend.service;

import ptithcm.tttnd35backend.dto.response.pagination.PageResponse;
import ptithcm.tttnd35backend.entity.Profile;
import ptithcm.tttnd35backend.rag.dto.RagAnswerResponse;
import ptithcm.tttnd35backend.rag.dto.RagFeedbackRequest;
import ptithcm.tttnd35backend.rag.dto.RagQueryRequest;

import java.util.List;
import java.util.Map;

public interface IRagService {
    RagAnswerResponse processChat(RagQueryRequest request, Profile profile);
    void submitFeedback(RagFeedbackRequest request, Profile profile);
    Map<String, Object> getAnalytics();
    PageResponse<Map<String, Object>> getConversations(int page, int size);
    List<Map<String, Object>> getUnansweredQuestions();
}
