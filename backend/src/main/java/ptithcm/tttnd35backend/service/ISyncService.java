package ptithcm.tttnd35backend.service;

import java.util.UUID;

public interface ISyncService {
    void syncProductToRAG(UUID productId);
    void deleteProductFromRAG(UUID productId);
}
