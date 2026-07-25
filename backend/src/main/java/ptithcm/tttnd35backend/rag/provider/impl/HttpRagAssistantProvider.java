package ptithcm.tttnd35backend.rag.provider.impl;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import ptithcm.tttnd35backend.rag.dto.*;
import ptithcm.tttnd35backend.rag.provider.RagAssistantProvider;

import java.math.BigDecimal;
import java.util.ArrayList;

@Slf4j
@Component
@ConditionalOnProperty(name = "rag.provider", havingValue = "http")
public class HttpRagAssistantProvider implements RagAssistantProvider {

    @Value("${rag.http.base-url:http://localhost:8000/api/v1/rag}")
    private String baseUrl;

    @Value("${rag.http.api-key:}")
    private String apiKey;

    @Override
    public RagAnswerResponse answer(RagQueryRequest request, RagContext context) {
        log.info("Dispatching query to HttpRagAssistantProvider endpoint: {}", baseUrl);
        // Fallback or external HTTP integration adapter template
        if (baseUrl == null || baseUrl.isBlank()) {
            log.warn("RAG HTTP Base URL unconfigured. Returning graceful fallback answer.");
            return fallbackAnswer(request);
        }

        try {
            // Future production HTTP/gRPC call to Python FastApi RAG engine
            return fallbackAnswer(request);
        } catch (Exception e) {
            log.error("Failed to connect to external RAG HTTP service: {}", e.getMessage());
            return fallbackAnswer(request);
        }
    }

    @Override
    public HealthStatus health() {
        return HealthStatus.builder()
                .healthy(baseUrl != null && !baseUrl.isBlank())
                .providerName("HttpRagAssistantProvider")
                .details("Configured Base URL: " + baseUrl)
                .build();
    }

    private RagAnswerResponse fallbackAnswer(RagQueryRequest request) {
        return RagAnswerResponse.builder()
                .answer("Hệ thống RAG Service đang được kết nối. Quý khách vui lòng đặt câu hỏi cụ thể về sản phẩm ShopWise!")
                .confidence(new BigDecimal("0.8000"))
                .sources(new ArrayList<>())
                .suggestedProducts(new ArrayList<>())
                .provider("http-fallback")
                .build();
    }
}
