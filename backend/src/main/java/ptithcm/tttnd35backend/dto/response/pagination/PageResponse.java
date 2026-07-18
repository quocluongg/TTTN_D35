package ptithcm.tttnd35backend.dto.response.pagination;

import lombok.*;

import java.util.List;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PageResponse<T> {
    private List<T> items;
    private PaginationMeta pagination;
}