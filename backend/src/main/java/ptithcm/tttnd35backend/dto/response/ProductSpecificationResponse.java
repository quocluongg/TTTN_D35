package ptithcm.tttnd35backend.dto.response;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductSpecificationResponse {
    private Long id;
    private Integer attributeKeyId;
    private String attributeName;
    private String attributeDisplayName;
    private String specGroup;
    private String specValue;
    private String specUnit;
}
