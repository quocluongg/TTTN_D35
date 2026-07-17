package ptithcm.tttnd35backend.dto.response.pagination;

import lombok.*;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PaginationMeta {
    private int currentPage;   // page hiện tại (tính từ 0)
    private int pageSize;      // số item mỗi trang
    private int totalPages;    // tổng số trang
    private long totalItems;   // tổng số item
}