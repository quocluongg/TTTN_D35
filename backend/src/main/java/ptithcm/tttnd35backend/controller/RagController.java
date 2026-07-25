package ptithcm.tttnd35backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import ptithcm.tttnd35backend.config.security.UserPrincipal;
import ptithcm.tttnd35backend.dto.response.ApiResponse;
import ptithcm.tttnd35backend.dto.response.pagination.PageResponse;
import ptithcm.tttnd35backend.rag.dto.RagAnswerResponse;
import ptithcm.tttnd35backend.rag.dto.RagFeedbackRequest;
import ptithcm.tttnd35backend.rag.dto.RagQueryRequest;
import ptithcm.tttnd35backend.service.IRagService;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class RagController {

    private final IRagService ragService;

    private <T> ResponseEntity<ApiResponse<T>> ok(T data) {
        return ResponseEntity.ok(ApiResponse.<T>builder()
                .success(true)
                .data(data)
                .timestamp(LocalDateTime.now())
                .build());
    }

    @PostMapping("/rag/chat")
    public ResponseEntity<ApiResponse<RagAnswerResponse>> chat(
            @Valid @RequestBody RagQueryRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ok(ragService.processChat(request, principal != null ? principal.getProfile() : null));
    }

    @PostMapping("/rag/feedback")
    public ResponseEntity<ApiResponse<Void>> feedback(
            @Valid @RequestBody RagFeedbackRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        ragService.submitFeedback(request, principal != null ? principal.getProfile() : null);
        return ok(null);
    }

    @GetMapping("/admin/rag/analytics")
    @PreAuthorize("hasAuthority('RAG_VIEW') or hasAuthority('REPORT_VIEW')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> analytics() {
        return ok(ragService.getAnalytics());
    }

    @GetMapping("/admin/rag/conversations")
    @PreAuthorize("hasAuthority('RAG_VIEW')")
    public ResponseEntity<ApiResponse<PageResponse<Map<String, Object>>>> conversations(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ok(ragService.getConversations(page, size));
    }

    @GetMapping("/admin/rag/unanswered")
    @PreAuthorize("hasAuthority('RAG_VIEW') or hasAuthority('RAG_FEEDBACK_REVIEW')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> unanswered() {
        return ok(ragService.getUnansweredQuestions());
    }
}
