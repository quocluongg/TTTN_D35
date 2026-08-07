package ptithcm.tttnd35backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;
import ptithcm.tttnd35backend.dto.response.ApiResponse;
import ptithcm.tttnd35backend.dto.response.NewsResponse;
import ptithcm.tttnd35backend.dto.response.pagination.PageResponse;
import ptithcm.tttnd35backend.service.INewsService;
import ptithcm.tttnd35backend.util.enums.NewsCategory;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping({"/api/v1/news", "/news"})
@RequiredArgsConstructor
public class NewsController {

    private final INewsService newsService;

    @GetMapping
    public ApiResponse<PageResponse<NewsResponse>> getPublicNews(
            @RequestParam(required = false) NewsCategory category,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        var pageable = PageRequest.of(page, size, Sort.by("publishedAt").descending());
        return ApiResponse.<PageResponse<NewsResponse>>builder()
                .success(true)
                .data(newsService.getPublicNews(category, search, pageable))
                .timestamp(LocalDateTime.now())
                .build();
    }

    @GetMapping("/{slug}")
    public ApiResponse<NewsResponse> getBySlug(@PathVariable String slug) {
        return ApiResponse.<NewsResponse>builder()
                .success(true)
                .data(newsService.getNewsBySlug(slug))
                .timestamp(LocalDateTime.now())
                .build();
    }

    @GetMapping("/recent")
    public ApiResponse<List<NewsResponse>> getRecent(@RequestParam(defaultValue = "5") int limit) {
        return ApiResponse.<List<NewsResponse>>builder()
                .success(true)
                .data(newsService.getRecentNews(limit))
                .timestamp(LocalDateTime.now())
                .build();
    }
}
/*
 * Example cURL:
 * 1. GET /api/v1/news?page=0&size=10&category=TECH
 * curl -X GET "http://localhost:8080/api/v1/news?category=TECH"
 *
 * 2. GET /api/v1/news/tin-tuc-cong-nghe-moi-nhat
 * curl -X GET "http://localhost:8080/api/v1/news/tin-tuc-cong-nghe-moi-nhat"
 */
