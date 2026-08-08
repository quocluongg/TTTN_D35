package ptithcm.tttnd35backend.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import ptithcm.tttnd35backend.service.ISyncService;

import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class SyncServiceImpl implements ISyncService {

    @Value("${service.rag.api-url}")
    private String ragApiUrl;

    @Value("${service.rag.api-key}")
    private String ragApiKey;

    private final RestClient restClient;

    @Override
    @Async
    public void syncProductToRAG(UUID productId) {
        try {
            String response = restClient.post()
                    .uri(ragApiUrl + "/sync/product/" + productId)
                    .header("X-API-Key", ragApiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .retrieve()
                    .body(String.class);

            log.info("RAG sync started for product {}: {}", productId, response);
        } catch (Exception e) {
            log.error("RAG sync failed for product {}: {}", productId, e.getMessage());
            // Don't throw - sync failure shouldn't block admin CRUD
        }
    }

    @Override
    @Async
    public void deleteProductFromRAG(UUID productId) {
        try {
            String response = restClient.delete()
                    .uri(ragApiUrl + "/sync/product/" + productId)
                    .header("X-API-Key", ragApiKey)
                    .retrieve()
                    .body(String.class);

            log.info("RAG delete completed for product {}: {}", productId, response);
        } catch (Exception e) {
            log.error("RAG delete failed for product {}: {}", productId, e.getMessage());
            // Don't throw - delete failure shouldn't block admin CRUD
        }
    }
}
