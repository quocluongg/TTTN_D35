package ptithcm.tttnd35backend.rag;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import ptithcm.tttnd35backend.rag.dto.HealthStatus;
import ptithcm.tttnd35backend.rag.dto.RagAnswerResponse;
import ptithcm.tttnd35backend.rag.dto.RagContext;
import ptithcm.tttnd35backend.rag.dto.RagQueryRequest;
import ptithcm.tttnd35backend.rag.provider.impl.MockRagAssistantProvider;
import ptithcm.tttnd35backend.repository.IProductRepository;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

class MockRagAssistantProviderTest {

    @Mock
    private IProductRepository productRepository;

    private MockRagAssistantProvider mockRagProvider;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        mockRagProvider = new MockRagAssistantProvider(productRepository);
    }

    @Test
    @DisplayName("Test Laptop Query Returns High Confidence Answer and Sources")
    void testLaptopQuery() {
        RagQueryRequest request = RagQueryRequest.builder().message("Tư vấn mua laptop").build();
        RagContext context = RagContext.builder().role("CUSTOMER").build();

        RagAnswerResponse response = mockRagProvider.answer(request, context);

        assertNotNull(response);
        assertEquals("mock", response.getProvider());
        assertTrue(response.getConfidence().compareTo(new BigDecimal("0.9000")) > 0);
        assertFalse(response.getSources().isEmpty());
    }

    @Test
    @DisplayName("Test Health Check Status")
    void testHealthCheck() {
        HealthStatus health = mockRagProvider.health();
        assertTrue(health.isHealthy());
        assertEquals("MockRagAssistantProvider", health.getProviderName());
    }
}
