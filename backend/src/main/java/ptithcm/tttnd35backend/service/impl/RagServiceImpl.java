package ptithcm.tttnd35backend.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ptithcm.tttnd35backend.dto.response.pagination.PageResponse;
import ptithcm.tttnd35backend.entity.*;
import ptithcm.tttnd35backend.rag.dto.*;
import ptithcm.tttnd35backend.rag.provider.RagAssistantProvider;
import ptithcm.tttnd35backend.repository.*;
import ptithcm.tttnd35backend.service.IRagService;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class RagServiceImpl implements IRagService {

    private final RagAssistantProvider ragProvider;
    private final IRagConversationRepository conversationRepository;
    private final IRagMessageRepository messageRepository;
    private final IRagFeedbackRepository feedbackRepository;
    private final IRagUnansweredQuestionRepository unansweredRepository;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    @SneakyThrows
    public RagAnswerResponse processChat(RagQueryRequest request, Profile profile) {
        RagConversation conversation;

        if (request.getConversationId() != null) {
            conversation = conversationRepository.findById(request.getConversationId())
                    .orElseGet(() -> conversationRepository.save(RagConversation.builder().user(profile).build()));
        } else {
            conversation = conversationRepository.save(RagConversation.builder().user(profile).build());
        }

        // Save User Message
        messageRepository.save(RagMessage.builder()
                .conversation(conversation)
                .role("USER")
                .content(request.getMessage())
                .provider(ragProvider.health().getProviderName())
                .build());

        // Context
        RagContext context = RagContext.builder()
                .userId(profile != null ? profile.getId() : null)
                .role(profile != null && profile.getRole() != null ? profile.getRole().getName() : "ANONYMOUS")
                .build();

        // Query Provider
        RagAnswerResponse answer = ragProvider.answer(request, context);

        // Save Assistant Message
        RagMessage assistantMsg = messageRepository.save(RagMessage.builder()
                .conversation(conversation)
                .role("ASSISTANT")
                .content(answer.getAnswer())
                .confidence(answer.getConfidence())
                .sources(objectMapper.writeValueAsString(answer.getSources()))
                .suggestedProducts(objectMapper.writeValueAsString(answer.getSuggestedProducts()))
                .provider(answer.getProvider())
                .build());

        answer.setConversationId(conversation.getId());
        answer.setMessageId(assistantMsg.getId());

        // Track low confidence questions (< 0.80)
        if (answer.getConfidence() != null && answer.getConfidence().compareTo(new BigDecimal("0.8000")) < 0) {
            unansweredRepository.save(RagUnansweredQuestion.builder()
                    .conversation(conversation)
                    .question(request.getMessage())
                    .confidence(answer.getConfidence())
                    .category("Low Confidence Response")
                    .build());
        }

        return answer;
    }

    @Override
    @Transactional
    public void submitFeedback(RagFeedbackRequest request, Profile profile) {
        RagMessage message = messageRepository.findById(request.getMessageId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy tin nhắn RAG"));

        feedbackRepository.save(RagFeedback.builder()
                .message(message)
                .rating(request.getRating())
                .note(request.getNote())
                .createdBy(profile)
                .build());
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getAnalytics() {
        long totalConversations = conversationRepository.count();
        long totalMessages = messageRepository.count();
        long positiveFeedback = feedbackRepository.countByRating(1);
        long negativeFeedback = feedbackRepository.countByRating(-1);
        long unansweredCount = unansweredRepository.count();

        HealthStatus health = ragProvider.health();

        Map<String, Object> metrics = new HashMap<>();
        metrics.put("totalConversations", totalConversations);
        metrics.put("totalMessages", totalMessages);
        metrics.put("positiveFeedback", positiveFeedback);
        metrics.put("negativeFeedback", negativeFeedback);
        metrics.put("unansweredCount", unansweredCount);
        metrics.put("providerName", health.getProviderName());
        metrics.put("providerStatus", health.isHealthy() ? "HEALTHY" : "UNHEALTHY");
        metrics.put("providerDetails", health.getDetails());
        return metrics;
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<Map<String, Object>> getConversations(int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "startedAt"));
        Page<RagConversation> convPage = conversationRepository.findAll(pageRequest);

        Page<Map<String, Object>> mappedPage = convPage.map(c -> {
            Map<String, Object> item = new HashMap<>();
            item.put("id", c.getId());
            item.put("userId", c.getUser() != null ? c.getUser().getId() : null);
            item.put("userEmail", c.getUser() != null ? c.getUser().getEmail() : "Khách ẩn danh");
            item.put("status", c.getStatus());
            item.put("startedAt", c.getStartedAt());
            return item;
        });

        return ptithcm.tttnd35backend.util.helper.PageResponseHelper.toPageResponse(mappedPage);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getUnansweredQuestions() {
        return unansweredRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt")).stream().map(q -> {
            Map<String, Object> item = new HashMap<>();
            item.put("id", q.getId());
            item.put("question", q.getQuestion());
            item.put("confidence", q.getConfidence());
            item.put("category", q.getCategory());
            item.put("createdAt", q.getCreatedAt());
            return item;
        }).toList();
    }
}
