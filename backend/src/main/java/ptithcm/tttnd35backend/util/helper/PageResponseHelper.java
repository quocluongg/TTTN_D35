package ptithcm.tttnd35backend.util.helper;

import org.springframework.data.domain.Page;
import ptithcm.tttnd35backend.dto.response.pagination.PageResponse;
import ptithcm.tttnd35backend.dto.response.pagination.PaginationMeta;

public class PageResponseHelper {
    public static <T> PageResponse<T> toPageResponse(Page<T> page) {
        PaginationMeta pagination = PaginationMeta.builder()
                .currentPage(page.getNumber())
                .pageSize(page.getSize())
                .totalPages(page.getTotalPages())
                .totalItems(page.getTotalElements())
                .build();

        return PageResponse.<T>builder()
                .items(page.getContent())
                .pagination(pagination)
                .build();
    }
}
