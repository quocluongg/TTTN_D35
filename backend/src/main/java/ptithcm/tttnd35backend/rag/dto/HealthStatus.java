package ptithcm.tttnd35backend.rag.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HealthStatus {
    private boolean healthy;
    private String providerName;
    private String details;
}
