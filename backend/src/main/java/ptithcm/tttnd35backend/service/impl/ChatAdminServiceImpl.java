package ptithcm.tttnd35backend.service.impl;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import ptithcm.tttnd35backend.dto.request.FlagUpdateRequest;
import ptithcm.tttnd35backend.dto.request.KnowledgeBaseVersionRequest;
import ptithcm.tttnd35backend.dto.request.SensitiveQuestionRequest;
import ptithcm.tttnd35backend.dto.request.TakeoverRequest;
import ptithcm.tttnd35backend.dto.response.*;
import ptithcm.tttnd35backend.dto.response.pagination.PageResponse;
import ptithcm.tttnd35backend.dto.response.pagination.PaginationMeta;
import ptithcm.tttnd35backend.entity.*;
import ptithcm.tttnd35backend.exception.DuplicateResourceException;
import ptithcm.tttnd35backend.exception.ResourceNotFoundException;
import ptithcm.tttnd35backend.repository.*;
import ptithcm.tttnd35backend.service.IChatAdminService;
import ptithcm.tttnd35backend.util.enums.ConversationStatus;
import ptithcm.tttnd35backend.util.enums.MessageFlagStatus;
import ptithcm.tttnd35backend.util.enums.MessageRole;
import ptithcm.tttnd35backend.util.enums.ChatSource;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChatAdminServiceImpl implements IChatAdminService {

    private final IChatConversationRepository conversationRepository;
    private final IChatMessageRepository messageRepository;
    private final IChatConversionEventRepository conversionEventRepository;
    private final ISensitiveQuestionRepository sensitiveQuestionRepository;
    private final IKnowledgeBaseVersionRepository kbVersionRepository;
    private final IProfileRepository profileRepository;

    @PersistenceContext
    private final EntityManager entityManager;

    @Override
    public PageResponse<ChatConversationResponse> getConversations(String search, String status, String source,
                                                                   LocalDateTime from, LocalDateTime to, Pageable pageable) {
        Specification<ChatConversation> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (StringUtils.hasText(search)) {
                String like = "%" + search.toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("sessionId")), like),
                        cb.like(cb.lower(root.join("user").get("email")), like),
                        cb.like(cb.lower(root.join("user").get("fullName")), like)
                ));
            }
            if (StringUtils.hasText(status)) {
                predicates.add(cb.equal(root.get("status"), ConversationStatus.valueOf(status)));
            }
            if (StringUtils.hasText(source)) {
                predicates.add(cb.equal(root.get("source"), ChatSource.valueOf(source)));
            }
            if (from != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("startedAt"), from));
            }
            if (to != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("startedAt"), to));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<ChatConversation> page = conversationRepository.findAll(spec, pageable);
        return PageResponse.<ChatConversationResponse>builder()
                .items(page.getContent().stream().map(this::toConversationResponse).toList())
                .pagination(PaginationMeta.builder()
                        .currentPage(page.getNumber())
                        .pageSize(page.getSize())
                        .totalPages(page.getTotalPages())
                        .totalItems(page.getTotalElements())
                        .build())
                .build();
    }

    @Override
    public ChatConversationResponse getConversationDetail(UUID conversationId) {
        ChatConversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hội thoại: " + conversationId));
        return toConversationResponse(conversation);
    }

    @Override
    public PageResponse<ChatMessageResponse> getMessages(UUID conversationId, Pageable pageable) {
        Page<ChatMessage> page = messageRepository.findByConversationId(conversationId, pageable);
        return PageResponse.<ChatMessageResponse>builder()
                .items(page.getContent().stream().map(this::toMessageResponse).toList())
                .pagination(PaginationMeta.builder()
                        .currentPage(page.getNumber())
                        .pageSize(page.getSize())
                        .totalPages(page.getTotalPages())
                        .totalItems(page.getTotalElements())
                        .build())
                .build();
    }

    @Override
    @Transactional
    public ChatMessageResponse flagMessage(UUID messageId, FlagUpdateRequest request) {
        ChatMessage message = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tin nhắn: " + messageId));
        message.setFlagStatus(request.flagStatus());
        message.setFlagNote(request.note());
        return toMessageResponse(messageRepository.save(message));
    }

    @Override
    @Transactional
    public ChatConversationResponse takeover(UUID conversationId, UUID staffId, TakeoverRequest request) {
        ChatConversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hội thoại: " + conversationId));
        conversation.setStatus(ConversationStatus.HANDOFF);
        if (staffId != null) {
            profileRepository.findById(staffId).ifPresent(conversation::setHandoffStaff);
        }

        ChatMessage staffMsg = ChatMessage.builder()
                .conversation(conversation)
                .role(MessageRole.STAFF)
                .content(request.message())
                .build();
        messageRepository.save(staffMsg);

        return toConversationResponse(conversationRepository.save(conversation));
    }

    @Override
    @Transactional
    public ChatConversationResponse closeConversation(UUID conversationId) {
        ChatConversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hội thoại: " + conversationId));
        conversation.setStatus(ConversationStatus.CLOSED);
        conversation.setEndedAt(LocalDateTime.now());
        return toConversationResponse(conversationRepository.save(conversation));
    }

    @Override
    public ChatDashboardResponse getDashboard(LocalDateTime from, LocalDateTime to) {
        Long conversations = countConversations(from, to);
        Long active = countConversationsByStatus(ConversationStatus.ACTIVE, from, to);
        Long handoff = countConversationsByStatus(ConversationStatus.HANDOFF, from, to);
        Long messages = countMessages(from, to);
        Long flagged = countMessagesByFlag(MessageFlagStatus.NEEDS_REVIEW, from, to);
        Double avgDuration = avgSessionDuration(from, to);
        Long addToCart = conversionEventRepository.countAddToCart(from, to);
        Long ordersPlaced = conversionEventRepository.countOrdersPlaced(from, to);
        Long recommended = conversionEventRepository.countRecommended(from, to);

        double addToCartRate = recommended > 0 ? (addToCart * 100.0 / recommended) : 0.0;
        double orderRate = addToCart > 0 ? (ordersPlaced * 100.0 / addToCart) : 0.0;

        return ChatDashboardResponse.builder()
                .totalConversations(conversations)
                .activeConversations(active)
                .handoffConversations(handoff)
                .totalMessages(messages)
                .flaggedMessages(flagged)
                .needsReviewCount(flagged)
                .avgSessionDurationSeconds(avgDuration != null ? avgDuration : 0.0)
                .addToCartRate(round2(addToCartRate))
                .orderConversionRate(round2(orderRate))
                .totalOrdersPlaced(ordersPlaced)
                .activeKnowledgeBaseVersionCount(kbVersionRepository.count())
                .sensitiveQuestionCount(sensitiveQuestionRepository.count())
                .build();
    }

    @Override
    public List<ChatStatPointResponse> getUserStats(LocalDateTime from, LocalDateTime to, String groupBy) {
        String dateFormat = switch (groupBy == null ? "day" : groupBy) {
            case "week" -> "IYYY\"-W\"IW";
            case "month" -> "YYYY-MM";
            case "quarter" -> "YYYY\"-Q\"Q";
            default -> "YYYY-MM-DD";
        };
        String sql = """
                SELECT TO_CHAR(c.started_at, '%s') AS period,
                       COUNT(DISTINCT c.id) AS conversations,
                       COUNT(DISTINCT c.user_id) AS unique_users,
                       COALESCE(AVG(EXTRACT(EPOCH FROM (c.ended_at - c.started_at))), 0) AS avg_duration,
                       (SELECT COUNT(*) FROM chat_messages m
                         JOIN chat_conversations cc ON cc.id = m.conversation_id
                         WHERE TO_CHAR(cc.started_at, '%s') = TO_CHAR(c.started_at, '%s')) AS messages,
                       (SELECT COUNT(*) FROM chat_conversion_events e
                         JOIN chat_conversations cc2 ON cc2.id = e.conversation_id
                         WHERE TO_CHAR(cc2.started_at, '%s') = TO_CHAR(c.started_at, '%s') AND e.event_type = 'ADD_TO_CART') AS add_to_cart,
                       (SELECT COUNT(*) FROM chat_conversion_events e2
                         JOIN chat_conversations cc3 ON cc3.id = e2.conversation_id
                         WHERE TO_CHAR(cc3.started_at, '%s') = TO_CHAR(c.started_at, '%s') AND e2.event_type = 'ORDER_PLACED') AS orders_placed
                FROM chat_conversations c
                WHERE (:from IS NULL OR c.started_at >= CAST(:from AS TIMESTAMP))
                  AND (:to IS NULL OR c.started_at <= CAST(:to AS TIMESTAMP))
                GROUP BY TO_CHAR(c.started_at, '%s')
                ORDER BY TO_CHAR(c.started_at, '%s') ASC
                """.formatted(dateFormat, dateFormat, dateFormat, dateFormat, dateFormat, dateFormat, dateFormat, dateFormat, dateFormat, dateFormat);

        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("from", from);
        query.setParameter("to", to);

        @SuppressWarnings("unchecked")
        List<Object[]> rows = query.getResultList();
        List<ChatStatPointResponse> result = new ArrayList<>();
        for (Object[] row : rows) {
            String period = (String) row[0];
            long conv = ((Number) row[1]).longValue();
            long users = row[2] != null ? ((Number) row[2]).longValue() : 0L;
            double avgDur = row[3] != null ? ((Number) row[3]).doubleValue() : 0.0;
            long msgs = row[4] != null ? ((Number) row[4]).longValue() : 0L;
            long addToCart = row[5] != null ? ((Number) row[5]).longValue() : 0L;
            long orders = row[6] != null ? ((Number) row[6]).longValue() : 0L;
            double convRate = conv > 0 ? (orders * 100.0 / conv) : 0.0;

            result.add(ChatStatPointResponse.builder()
                    .period(period)
                    .conversations(conv)
                    .uniqueUsers(users)
                    .avgDurationSeconds(round2(avgDur))
                    .messages(msgs)
                    .addToCartCount(addToCart)
                    .orderPlacedCount(orders)
                    .conversionRate(round2(convRate))
                    .build());
        }
        return result;
    }

    @Override
    public List<ChatTopProductResponse> getTopProductsAsked(int limit) {
        int maxLimit = limit > 0 ? limit : 10;
        String sql = """
                SELECT p.id, p.name,
                       COUNT(m.id) AS mention_count,
                       (SELECT COUNT(*) FROM chat_conversion_events e
                         WHERE e.product_id = p.id AND e.event_type = 'ORDER_PLACED') AS order_count
                FROM chat_messages m
                JOIN chat_conversations c ON c.id = m.conversation_id
                LEFT JOIN unnest(m.product_ids) AS pid ON TRUE
                LEFT JOIN products p ON p.id = pid
                WHERE p.id IS NOT NULL
                GROUP BY p.id, p.name
                ORDER BY mention_count DESC
                LIMIT :limit
                """;
        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("limit", maxLimit);
        @SuppressWarnings("unchecked")
        List<Object[]> rows = query.getResultList();
        List<ChatTopProductResponse> result = new ArrayList<>();
        for (Object[] row : rows) {
            result.add(ChatTopProductResponse.builder()
                    .productId(UUID.fromString(row[0].toString()))
                    .productName((String) row[1])
                    .mentionCount(((Number) row[2]).longValue())
                    .orderCount(row[3] != null ? ((Number) row[3]).longValue() : 0L)
                    .build());
        }
        return result;
    }

    @Override
    public List<ChatTopQuestionResponse> getTopQuestionsByCategory(int limit) {
        int maxLimit = limit > 0 ? limit : 10;
        String sql = """
                SELECT COALESCE(intent, 'unknown') AS intent, COUNT(*) AS cnt
                FROM chat_messages
                WHERE role = 'USER'
                GROUP BY intent
                ORDER BY cnt DESC
                LIMIT :limit
                """;
        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("limit", maxLimit);
        @SuppressWarnings("unchecked")
        List<Object[]> rows = query.getResultList();
        long total = rows.stream().mapToLong(r -> ((Number) r[1]).longValue()).sum();
        List<ChatTopQuestionResponse> result = new ArrayList<>();
        for (Object[] row : rows) {
            long cnt = ((Number) row[1]).longValue();
            result.add(ChatTopQuestionResponse.builder()
                    .category((String) row[0])
                    .questionCount(cnt)
                    .percentage(round2(total > 0 ? cnt * 100.0 / total : 0.0))
                    .build());
        }
        return result;
    }

    @Override
    public List<ChatKbEffectivenessResponse> getKbEffectiveness() {
        String sql = """
                SELECT v.name AS version_name,
                       COUNT(DISTINCT c.id) AS conversations,
                       (SELECT COUNT(*) FROM chat_messages m
                         JOIN chat_conversations cc ON cc.id = m.conversation_id
                         WHERE cc.kb_version_id = v.id) AS messages,
                       COALESCE(AVG(m2.confidence), 0) AS avg_conf,
                       (SELECT COUNT(*) FROM chat_messages mf
                         JOIN chat_conversations ccf ON ccf.id = mf.conversation_id
                         WHERE ccf.kb_version_id = v.id AND mf.flag_status = 'NEEDS_REVIEW') AS flagged,
                       (SELECT COUNT(*) FROM chat_conversion_events e
                         JOIN chat_conversations cco ON cco.id = e.conversation_id
                         WHERE cco.kb_version_id = v.id AND e.event_type = 'ORDER_PLACED') AS orders
                FROM knowledge_base_version v
                LEFT JOIN chat_conversations c ON c.kb_version_id = v.id
                LEFT JOIN chat_messages m2 ON m2.conversation_id = c.id
                GROUP BY v.id, v.name
                ORDER BY conversations DESC
                """;
        Query query = entityManager.createNativeQuery(sql);
        @SuppressWarnings("unchecked")
        List<Object[]> rows = query.getResultList();
        List<ChatKbEffectivenessResponse> result = new ArrayList<>();
        for (Object[] row : rows) {
            String version = (String) row[0];
            long conversations = ((Number) row[1]).longValue();
            long messages = row[2] != null ? ((Number) row[2]).longValue() : 0L;
            double avgConf = row[3] != null ? ((Number) row[3]).doubleValue() : 0.0;
            long flagged = row[4] != null ? ((Number) row[4]).longValue() : 0L;
            long orders = row[5] != null ? ((Number) row[5]).longValue() : 0L;
            double flaggedRate = messages > 0 ? flagged * 100.0 / messages : 0.0;
            double convRate = conversations > 0 ? orders * 100.0 / conversations : 0.0;

            result.add(ChatKbEffectivenessResponse.builder()
                    .versionName(version)
                    .conversations(conversations)
                    .messages(messages)
                    .avgConfidence(round2(avgConf))
                    .flaggedCount(flagged)
                    .flaggedRate(round2(flaggedRate))
                    .ordersPlaced(orders)
                    .conversionRate(round2(convRate))
                    .build());
        }
        return result;
    }

    @Override
    public List<ChatSourceComparisonResponse> getSourceComparison(LocalDateTime from, LocalDateTime to) {
        String sql = """
                SELECT c.source,
                       COUNT(DISTINCT c.id) AS conversations,
                       COUNT(DISTINCT c.user_id) AS unique_users,
                       (SELECT COUNT(*) FROM chat_conversion_events e
                          JOIN chat_conversations cc ON cc.id = e.conversation_id
                          WHERE cc.source = c.source AND e.event_type = 'ADD_TO_CART'
                            AND (:f IS NULL OR cc.started_at >= CAST(:f AS TIMESTAMP))
                            AND (:t IS NULL OR cc.started_at <= CAST(:t AS TIMESTAMP))) AS add_to_cart,
                       (SELECT COUNT(*) FROM chat_conversion_events e2
                          JOIN chat_conversations cc2 ON cc2.id = e2.conversation_id
                          WHERE cc2.source = c.source AND e2.event_type = 'ORDER_PLACED'
                            AND (:f IS NULL OR cc2.started_at >= CAST(:f AS TIMESTAMP))
                            AND (:t IS NULL OR cc2.started_at <= CAST(:t AS TIMESTAMP))) AS orders_placed,
                       (SELECT COALESCE(SUM(o.total_amount), 0) FROM chat_conversion_events e3
                          JOIN chat_conversations cc3 ON cc3.id = e3.conversation_id
                          JOIN orders o ON o.id = e3.order_id
                          WHERE cc3.source = c.source AND e3.event_type = 'ORDER_PLACED'
                            AND (:f IS NULL OR cc3.started_at >= CAST(:f AS TIMESTAMP))
                            AND (:t IS NULL OR cc3.started_at <= CAST(:t AS TIMESTAMP))) AS revenue
                FROM chat_conversations c
                WHERE (:f IS NULL OR c.started_at >= CAST(:f AS TIMESTAMP))
                  AND (:t IS NULL OR c.started_at <= CAST(:t AS TIMESTAMP))
                GROUP BY c.source
                ORDER BY c.source ASC
                """;
        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("f", from);
        query.setParameter("t", to);
        @SuppressWarnings("unchecked")
        List<Object[]> rows = query.getResultList();
        List<ChatSourceComparisonResponse> result = new ArrayList<>();
        for (Object[] row : rows) {
            String source = (String) row[0];
            long conversations = ((Number) row[1]).longValue();
            long users = row[2] != null ? ((Number) row[2]).longValue() : 0L;
            long addToCart = row[3] != null ? ((Number) row[3]).longValue() : 0L;
            long orders = row[4] != null ? ((Number) row[4]).longValue() : 0L;
            double revenue = row[5] != null ? ((Number) row[5]).doubleValue() : 0.0;

            double addToCartRate = conversations > 0 ? addToCart * 100.0 / conversations : 0.0;
            double convRate = addToCart > 0 ? orders * 100.0 / addToCart : 0.0;

            result.add(ChatSourceComparisonResponse.builder()
                    .source(source)
                    .conversations(conversations)
                    .uniqueUsers(users)
                    .addToCart(addToCart)
                    .ordersPlaced(orders)
                    .addToCartRate(round2(addToCartRate))
                    .conversionRate(round2(convRate))
                    .revenue(round2(revenue))
                    .build());
        }
        return result;
    }

    @Override
    public List<ChatRevenuePointResponse> getChatbotRevenue(LocalDateTime from, LocalDateTime to, String groupBy) {
        String dateFormat = switch (groupBy == null ? "day" : groupBy) {
            case "week" -> "IYYY\"-W\"IW";
            case "month" -> "YYYY-MM";
            case "quarter" -> "YYYY\"-Q\"Q";
            default -> "YYYY-MM-DD";
        };
        String sql = """
                SELECT TO_CHAR(o.created_at, '%s') AS period,
                       COUNT(DISTINCT e.order_id) AS orders,
                       COALESCE(SUM(o.total_amount), 0) AS revenue
                FROM chat_conversion_events e
                JOIN chat_conversations c ON c.id = e.conversation_id
                JOIN orders o ON o.id = e.order_id
                WHERE e.event_type = 'ORDER_PLACED'
                  AND c.source = 'CHATBOT'
                  AND (:f IS NULL OR o.created_at >= CAST(:f AS TIMESTAMP))
                  AND (:t IS NULL OR o.created_at <= CAST(:t AS TIMESTAMP))
                GROUP BY TO_CHAR(o.created_at, '%s')
                ORDER BY TO_CHAR(o.created_at, '%s') ASC
                """.formatted(dateFormat, dateFormat, dateFormat);
        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("f", from);
        query.setParameter("t", to);
        @SuppressWarnings("unchecked")
        List<Object[]> rows = query.getResultList();
        List<ChatRevenuePointResponse> result = new ArrayList<>();
        for (Object[] row : rows) {
            result.add(ChatRevenuePointResponse.builder()
                    .period((String) row[0])
                    .orders(row[1] != null ? ((Number) row[1]).longValue() : 0L)
                    .revenue(round2(row[2] != null ? ((Number) row[2]).doubleValue() : 0.0))
                    .build());
        }
        return result;
    }

    @Override
    public List<SensitiveQuestionResponse> getSensitiveQuestions(String search, Boolean isActive) {
        return sensitiveQuestionRepository.findAll((root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (StringUtils.hasText(search)) {
                predicates.add(cb.like(cb.lower(root.get("pattern")), "%" + search.toLowerCase() + "%"));
            }
            if (isActive != null) {
                predicates.add(cb.equal(root.get("isActive"), isActive));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        }).stream().map(this::toSensitiveResponse).toList();
    }

    @Override
    @Transactional
    public SensitiveQuestionResponse createSensitiveQuestion(SensitiveQuestionRequest request) {
        if (sensitiveQuestionRepository.existsByPattern(request.pattern())) {
            throw new DuplicateResourceException("Câu hỏi nhạy cảm đã tồn tại: " + request.pattern());
        }
        SensitiveQuestion entity = SensitiveQuestion.builder()
                .pattern(request.pattern())
                .category(request.category())
                .isActive(request.isActive() == null || request.isActive())
                .build();
        return toSensitiveResponse(sensitiveQuestionRepository.save(entity));
    }

    @Override
    @Transactional
    public SensitiveQuestionResponse updateSensitiveQuestion(UUID id, SensitiveQuestionRequest request) {
        SensitiveQuestion entity = sensitiveQuestionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy câu hỏi nhạy cảm: " + id));
        entity.setPattern(request.pattern());
        entity.setCategory(request.category());
        if (request.isActive() != null) {
            entity.setActive(request.isActive());
        }
        return toSensitiveResponse(sensitiveQuestionRepository.save(entity));
    }

    @Override
    @Transactional
    public void deleteSensitiveQuestion(UUID id) {
        SensitiveQuestion entity = sensitiveQuestionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy câu hỏi nhạy cảm: " + id));
        sensitiveQuestionRepository.delete(entity);
    }

    @Override
    public List<KnowledgeBaseVersionResponse> getKnowledgeBaseVersions() {
        return kbVersionRepository.findAll().stream().map(this::toKbResponse).toList();
    }

    @Override
    @Transactional
    public KnowledgeBaseVersionResponse createKnowledgeBaseVersion(KnowledgeBaseVersionRequest request) {
        if (kbVersionRepository.existsByName(request.name())) {
            throw new DuplicateResourceException("Phiên bản KB đã tồn tại: " + request.name());
        }
        KnowledgeBaseVersion entity = KnowledgeBaseVersion.builder()
                .name(request.name())
                .description(request.description())
                .chunkingStrategy(request.chunkingStrategy())
                .embeddingModel(request.embeddingModel())
                .isActive(request.isActive() == null || request.isActive())
                .build();
        return toKbResponse(kbVersionRepository.save(entity));
    }

    // --- Mapping helpers ---

    private ChatConversationResponse toConversationResponse(ChatConversation c) {
        return ChatConversationResponse.builder()
                .id(c.getId())
                .sessionId(c.getSessionId())
                .userId(c.getUser() != null ? c.getUser().getId() : null)
                .userEmail(c.getUser() != null ? c.getUser().getEmail() : null)
                .userName(c.getUser() != null ? c.getUser().getFullName() : null)
                .status(c.getStatus())
                .handoffStaffId(c.getHandoffStaff() != null ? c.getHandoffStaff().getId() : null)
                .handoffStaffName(c.getHandoffStaff() != null ? c.getHandoffStaff().getFullName() : null)
                .source(c.getSource())
                .kbVersionId(c.getKbVersion() != null ? c.getKbVersion().getId() : null)
                .kbVersionName(c.getKbVersion() != null ? c.getKbVersion().getName() : null)
                .startedAt(c.getStartedAt())
                .endedAt(c.getEndedAt())
                .messageCount(messageRepository.countByConversationId(c.getId()))
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }

    private ChatMessageResponse toMessageResponse(ChatMessage m) {
        return ChatMessageResponse.builder()
                .id(m.getId())
                .conversationId(m.getConversation().getId())
                .role(m.getRole())
                .content(m.getContent())
                .intent(m.getIntent())
                .confidence(m.getConfidence())
                .latencyMs(m.getLatencyMs())
                .sources(m.getSources())
                .productIds(m.getProductIds())
                .flagStatus(m.getFlagStatus())
                .flagNote(m.getFlagNote())
                .createdAt(m.getCreatedAt())
                .build();
    }

    private SensitiveQuestionResponse toSensitiveResponse(SensitiveQuestion s) {
        return SensitiveQuestionResponse.builder()
                .id(s.getId())
                .pattern(s.getPattern())
                .category(s.getCategory())
                .isActive(s.isActive())
                .createdAt(s.getCreatedAt())
                .updatedAt(s.getUpdatedAt())
                .build();
    }

    private KnowledgeBaseVersionResponse toKbResponse(KnowledgeBaseVersion v) {
        return KnowledgeBaseVersionResponse.builder()
                .id(v.getId())
                .name(v.getName())
                .description(v.getDescription())
                .chunkingStrategy(v.getChunkingStrategy())
                .embeddingModel(v.getEmbeddingModel())
                .isActive(v.isActive())
                .createdAt(v.getCreatedAt())
                .build();
    }

    // --- Native count helpers ---

    private long countConversations(LocalDateTime from, LocalDateTime to) {
        Query q = entityManager.createNativeQuery("SELECT COUNT(*) FROM chat_conversations c WHERE (:f IS NULL OR c.started_at >= CAST(:f AS TIMESTAMP)) AND (:t IS NULL OR c.started_at <= CAST(:t AS TIMESTAMP))");
        q.setParameter("f", from);
        q.setParameter("t", to);
        return ((Number) q.getSingleResult()).longValue();
    }

    private long countConversationsByStatus(ConversationStatus status, LocalDateTime from, LocalDateTime to) {
        Query q = entityManager.createNativeQuery("SELECT COUNT(*) FROM chat_conversations c WHERE c.status = :s AND (:f IS NULL OR c.started_at >= CAST(:f AS TIMESTAMP)) AND (:t IS NULL OR c.started_at <= CAST(:t AS TIMESTAMP))");
        q.setParameter("s", status.name());
        q.setParameter("f", from);
        q.setParameter("t", to);
        return ((Number) q.getSingleResult()).longValue();
    }

    private long countMessages(LocalDateTime from, LocalDateTime to) {
        Query q = entityManager.createNativeQuery("SELECT COUNT(*) FROM chat_messages m JOIN chat_conversations c ON c.id = m.conversation_id WHERE (:f IS NULL OR c.started_at >= CAST(:f AS TIMESTAMP)) AND (:t IS NULL OR c.started_at <= CAST(:t AS TIMESTAMP))");
        q.setParameter("f", from);
        q.setParameter("t", to);
        return ((Number) q.getSingleResult()).longValue();
    }

    private long countMessagesByFlag(MessageFlagStatus status, LocalDateTime from, LocalDateTime to) {
        Query q = entityManager.createNativeQuery("SELECT COUNT(*) FROM chat_messages m JOIN chat_conversations c ON c.id = m.conversation_id WHERE m.flag_status = :s AND (:f IS NULL OR c.started_at >= CAST(:f AS TIMESTAMP)) AND (:t IS NULL OR c.started_at <= CAST(:t AS TIMESTAMP))");
        q.setParameter("s", status.name());
        q.setParameter("f", from);
        q.setParameter("t", to);
        return ((Number) q.getSingleResult()).longValue();
    }

    private Double avgSessionDuration(LocalDateTime from, LocalDateTime to) {
        Query q = entityManager.createNativeQuery("SELECT AVG(EXTRACT(EPOCH FROM (ended_at - started_at))) FROM chat_conversations WHERE ended_at IS NOT NULL AND (:f IS NULL OR started_at >= CAST(:f AS TIMESTAMP)) AND (:t IS NULL OR started_at <= CAST(:t AS TIMESTAMP))");
        q.setParameter("f", from);
        q.setParameter("t", to);
        Object val = q.getSingleResult();
        return val != null ? ((Number) val).doubleValue() : null;
    }

    private double round2(double value) {
        return BigDecimal.valueOf(value).setScale(2, RoundingMode.HALF_UP).doubleValue();
    }
}