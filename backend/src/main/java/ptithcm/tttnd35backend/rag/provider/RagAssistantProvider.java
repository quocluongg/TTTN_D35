package ptithcm.tttnd35backend.rag.provider;

import ptithcm.tttnd35backend.rag.dto.HealthStatus;
import ptithcm.tttnd35backend.rag.dto.RagAnswerResponse;
import ptithcm.tttnd35backend.rag.dto.RagContext;
import ptithcm.tttnd35backend.rag.dto.RagQueryRequest;

public interface RagAssistantProvider {
    RagAnswerResponse answer(RagQueryRequest request, RagContext context);
    HealthStatus health();
}
