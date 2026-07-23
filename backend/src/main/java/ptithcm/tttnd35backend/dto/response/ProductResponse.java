package ptithcm.tttnd35backend.dto.response;

import lombok.*;

import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductResponse {
    private String id;
    private String name;
    private String category;
    private Long price;
    private Long originalPrice;
    private String discountBadge;
    private String statusBadge;
    private String imageUrl;
    private Double rating;
    private Integer reviewsCount;
    private String useCase;
    private boolean isFeatured;
    private String description;
}
