package ptithcm.tttnd35backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import ptithcm.tttnd35backend.config.security.UserPrincipal;
import ptithcm.tttnd35backend.dto.request.FlagUpdateRequest;
import ptithcm.tttnd35backend.dto.request.KnowledgeBaseVersionRequest;
import ptithcm.tttnd35backend.dto.request.SensitiveQuestionRequest;
import ptithcm.tttnd35backend.dto.request.TakeoverRequest;
import ptithcm.tttnd35backend.dto.response.*;
import ptithcm.tttnd35backend.dto.response.pagination.PageResponse;
import ptithcm.tttnd35backend.service.IChatAdminService;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/admin/chat")
@RequiredArgsConstructor
public class ChatAdminController {

    private final IChatAdminService chatAdminService;

    // ===================== Conversations =====================

    @GetMapping("/conversations")
    @PreAuthorize("hasAuthority('RAG_VIEW')")
    public ApiResponse<PageResponse<ChatConversationResponse>> getConversations(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String source,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        var pageable = PageRequest.of(page, size, Sort.by("startedAt").descending());
        return ApiResponse.<PageResponse<ChatConversationResponse>>builder()
                .success(true)
                .data(chatAdminService.getConversations(search, status, source, from, to, pageable))
                .timestamp(LocalDateTime.now())
                .build();
    }

    @GetMapping("/conversations/{id}")
    @PreAuthorize("hasAuthority('RAG_VIEW')")
    public ApiResponse<ChatConversationResponse> getConversation(@PathVariable UUID id) {
        return ApiResponse.<ChatConversationResponse>builder()
                .success(true)
                .data(chatAdminService.getConversationDetail(id))
                .timestamp(LocalDateTime.now())
                .build();
    }

    @GetMapping("/conversations/{id}/messages")
    @PreAuthorize("hasAuthority('RAG_VIEW')")
    public ApiResponse<PageResponse<ChatMessageResponse>> getMessages(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size
    ) {
        var pageable = PageRequest.of(page, size, Sort.by("createdAt").ascending());
        return ApiResponse.<PageResponse<ChatMessageResponse>>builder()
                .success(true)
                .data(chatAdminService.getMessages(id, pageable))
                .timestamp(LocalDateTime.now())
                .build();
    }

    // ===================== Quality & Takeover =====================

    @PatchMapping("/messages/{id}/flag")
    @PreAuthorize("hasAuthority('RAG_FEEDBACK_REVIEW')")
    public ApiResponse<ChatMessageResponse> flagMessage(@PathVariable UUID id, @RequestBody @Valid FlagUpdateRequest request) {
        return ApiResponse.<ChatMessageResponse>builder()
                .success(true)
                .data(chatAdminService.flagMessage(id, request))
                .timestamp(LocalDateTime.now())
                .build();
    }

    @PostMapping("/conversations/{id}/takeover")
    @PreAuthorize("hasAuthority('RAG_MANAGE')")
    public ApiResponse<ChatConversationResponse> takeover(Authentication authentication, @PathVariable UUID id,
                                                          @RequestBody @Valid TakeoverRequest request) {
        UUID staffId = currentProfileId(authentication);
        return ApiResponse.<ChatConversationResponse>builder()
                .success(true)
                .message("Đã tiếp quản hội thoại")
                .data(chatAdminService.takeover(id, staffId, request))
                .timestamp(LocalDateTime.now())
                .build();
    }

    @PostMapping("/conversations/{id}/close")
    @PreAuthorize("hasAuthority('RAG_MANAGE')")
    public ApiResponse<ChatConversationResponse> closeConversation(@PathVariable UUID id) {
        return ApiResponse.<ChatConversationResponse>builder()
                .success(true)
                .message("Đã đóng hội thoại")
                .data(chatAdminService.closeConversation(id))
                .timestamp(LocalDateTime.now())
                .build();
    }

    // ===================== Dashboard & Analytics =====================

    @GetMapping("/dashboard")
    @PreAuthorize("hasAuthority('RAG_VIEW')")
    public ApiResponse<ChatDashboardResponse> getDashboard(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to
    ) {
        return ApiResponse.<ChatDashboardResponse>builder()
                .success(true)
                .data(chatAdminService.getDashboard(from, to))
                .timestamp(LocalDateTime.now())
                .build();
    }

    @GetMapping("/analytics/user-stats")
    @PreAuthorize("hasAuthority('RAG_VIEW')")
    public ApiResponse<List<ChatStatPointResponse>> getUserStats(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @RequestParam(defaultValue = "day") String groupBy
    ) {
        return ApiResponse.<List<ChatStatPointResponse>>builder()
                .success(true)
                .data(chatAdminService.getUserStats(from, to, groupBy))
                .timestamp(LocalDateTime.now())
                .build();
    }

    @GetMapping("/analytics/top-products-asked")
    @PreAuthorize("hasAuthority('RAG_VIEW')")
    public ApiResponse<List<ChatTopProductResponse>> getTopProductsAsked(
            @RequestParam(defaultValue = "10") int limit
    ) {
        return ApiResponse.<List<ChatTopProductResponse>>builder()
                .success(true)
                .data(chatAdminService.getTopProductsAsked(limit))
                .timestamp(LocalDateTime.now())
                .build();
    }

    @GetMapping("/analytics/top-questions")
    @PreAuthorize("hasAuthority('RAG_VIEW')")
    public ApiResponse<List<ChatTopQuestionResponse>> getTopQuestions(
            @RequestParam(defaultValue = "10") int limit
    ) {
        return ApiResponse.<List<ChatTopQuestionResponse>>builder()
                .success(true)
                .data(chatAdminService.getTopQuestionsByCategory(limit))
                .timestamp(LocalDateTime.now())
                .build();
    }

    @GetMapping("/analytics/kb-effectiveness")
    @PreAuthorize("hasAuthority('RAG_VIEW')")
    public ApiResponse<List<ChatKbEffectivenessResponse>> getKbEffectiveness() {
        return ApiResponse.<List<ChatKbEffectivenessResponse>>builder()
                .success(true)
                .data(chatAdminService.getKbEffectiveness())
                .timestamp(LocalDateTime.now())
                .build();
    }

    // ===================== Sensitive Questions =====================

    @GetMapping("/sensitive-questions")
    @PreAuthorize("hasAuthority('RAG_MANAGE')")
    public ApiResponse<List<SensitiveQuestionResponse>> getSensitiveQuestions(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean isActive
    ) {
        return ApiResponse.<List<SensitiveQuestionResponse>>builder()
                .success(true)
                .data(chatAdminService.getSensitiveQuestions(search, isActive))
                .timestamp(LocalDateTime.now())
                .build();
    }

    @PostMapping("/sensitive-questions")
    @PreAuthorize("hasAuthority('RAG_MANAGE')")
    public ApiResponse<SensitiveQuestionResponse> createSensitiveQuestion(@RequestBody @Valid SensitiveQuestionRequest request) {
        return ApiResponse.<SensitiveQuestionResponse>builder()
                .success(true)
                .data(chatAdminService.createSensitiveQuestion(request))
                .timestamp(LocalDateTime.now())
                .build();
    }

    @PutMapping("/sensitive-questions/{id}")
    @PreAuthorize("hasAuthority('RAG_MANAGE')")
    public ApiResponse<SensitiveQuestionResponse> updateSensitiveQuestion(@PathVariable UUID id, @RequestBody @Valid SensitiveQuestionRequest request) {
        return ApiResponse.<SensitiveQuestionResponse>builder()
                .success(true)
                .data(chatAdminService.updateSensitiveQuestion(id, request))
                .timestamp(LocalDateTime.now())
                .build();
    }

    @DeleteMapping("/sensitive-questions/{id}")
    @PreAuthorize("hasAuthority('RAG_MANAGE')")
    public ApiResponse<Void> deleteSensitiveQuestion(@PathVariable UUID id) {
        chatAdminService.deleteSensitiveQuestion(id);
        return ApiResponse.<Void>builder()
                .success(true)
                .message("Đã xóa câu hỏi nhạy cảm")
                .timestamp(LocalDateTime.now())
                .build();
    }

    // ===================== Knowledge Base Versions =====================

    @GetMapping("/kb-versions")
    @PreAuthorize("hasAuthority('RAG_VIEW')")
    public ApiResponse<List<KnowledgeBaseVersionResponse>> getKbVersions() {
        return ApiResponse.<List<KnowledgeBaseVersionResponse>>builder()
                .success(true)
                .data(chatAdminService.getKnowledgeBaseVersions())
                .timestamp(LocalDateTime.now())
                .build();
    }

    @PostMapping("/kb-versions")
    @PreAuthorize("hasAuthority('RAG_MANAGE')")
    public ApiResponse<KnowledgeBaseVersionResponse> createKbVersion(@RequestBody @Valid KnowledgeBaseVersionRequest request) {
        return ApiResponse.<KnowledgeBaseVersionResponse>builder()
                .success(true)
                .data(chatAdminService.createKnowledgeBaseVersion(request))
                .timestamp(LocalDateTime.now())
                .build();
    }

    private UUID currentProfileId(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof UserPrincipal principal)) {
            return null;
        }
        return principal.getProfile().getId();
    }
}