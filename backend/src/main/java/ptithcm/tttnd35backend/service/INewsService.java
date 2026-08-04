package ptithcm.tttnd35backend.service;

import org.springframework.data.domain.Pageable;
import ptithcm.tttnd35backend.dto.request.NewsRequest;
import ptithcm.tttnd35backend.dto.response.NewsResponse;
import ptithcm.tttnd35backend.dto.response.pagination.PageResponse;
import ptithcm.tttnd35backend.util.enums.NewsCategory;

import java.util.List;
import java.util.UUID;

public interface INewsService {

    PageResponse<NewsResponse> getPublicNews(NewsCategory category, String search, Pageable pageable);

    NewsResponse getNewsBySlug(String slug);

    List<NewsResponse> getRecentNews(int limit);

    PageResponse<NewsResponse> getAdminNews(NewsCategory category, String search, Boolean isPublished, Pageable pageable);

    NewsResponse getNewsById(UUID id);

    NewsResponse createNews(NewsRequest request, UUID currentUserId);

    NewsResponse updateNews(UUID id, NewsRequest request);

    NewsResponse updatePublishStatus(UUID id, boolean isPublished);

    void deleteNews(UUID id, boolean permanent);
}
