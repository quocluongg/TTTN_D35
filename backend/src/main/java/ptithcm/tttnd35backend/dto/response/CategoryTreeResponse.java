package ptithcm.tttnd35backend.dto.response;

import lombok.*;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryTreeResponse {
    private UUID id;
    private String name;
    private String slug;
    private String description;
    private boolean isActive;

    @Builder.Default
    private List<CategoryTreeResponse> children = new ArrayList<>();
}
