package ptithcm.tttnd35backend.dto.response;

import lombok.*;

/** Response cho một attribute key trong bảng lookup. */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductAttributeKeyResponse {
    private Integer id;
    private String name;
    private String displayName;
    private String unit;
    private int sortOrder;
}
