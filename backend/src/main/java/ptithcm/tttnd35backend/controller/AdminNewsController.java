package ptithcm.tttnd35backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import ptithcm.tttnd35backend.config.security.UserPrincipal;
import ptithcm.tttnd35backend.dto.request.NewsRequest;

import ptithcm.tttnd35backend.dto.response.ApiResponse;
import ptithcm.tttnd35backend.dto.response.NewsResponse;
import ptithcm.tttnd35backend.dto.response.pagination.PageResponse;
import ptithcm.tttnd35backend.service.INewsService;
import ptithcm.tttnd35backend.util.enums.NewsCategory;

import java.time.LocalDateTime;
import java.util.UUID;

@RestController
@RequestMapping("/admin/news")
@RequiredArgsConstructor
public class AdminNewsController {

    private final INewsService newsService;

    @GetMapping
    @PreAuthorize("hasAuthority('NEWS_MANAGE')")
    public ApiResponse<PageResponse<NewsResponse>> getAdminNews(
            @RequestParam(required = false) NewsCategory category,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean isPublished,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        var pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ApiResponse.<PageResponse<NewsResponse>>builder()
                .success(true)
                .data(newsService.getAdminNews(category, search, isPublished, pageable))
                .timestamp(LocalDateTime.now())
                .build();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('NEWS_MANAGE')")
    public ApiResponse<NewsResponse> getById(@PathVariable UUID id) {
        return ApiResponse.<NewsResponse>builder()
                .success(true)
                .data(newsService.getNewsById(id))
                .timestamp(LocalDateTime.now())
                .build();
    }

    @PostMapping
    @PreAuthorize("hasAuthority('NEWS_MANAGE')")
    public ApiResponse<NewsResponse> create(Authentication authentication, @RequestBody @Valid NewsRequest request) {
        UUID currentUserId = currentProfileId(authentication);
        return ApiResponse.<NewsResponse>builder()
                .success(true)
                .message("Tạo bài viết thành công")
                .data(newsService.createNews(request, currentUserId))
                .timestamp(LocalDateTime.now())
                .build();
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('NEWS_MANAGE')")
    public ApiResponse<NewsResponse> update(@PathVariable UUID id, @RequestBody @Valid NewsRequest request) {
        return ApiResponse.<NewsResponse>builder()
                .success(true)
                .message("Cập nhật bài viết thành công")
                .data(newsService.updateNews(id, request))
                .timestamp(LocalDateTime.now())
                .build();
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAuthority('NEWS_MANAGE')")
    public ApiResponse<NewsResponse> setStatus(@PathVariable UUID id, @RequestParam boolean isPublished) {
        return ApiResponse.<NewsResponse>builder()
                .success(true)
                .message(isPublished ? "Đã xuất bản bài viết" : "Đã chuyển bài viết về dạng nháp")
                .data(newsService.updatePublishStatus(id, isPublished))
                .timestamp(LocalDateTime.now())
                .build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('NEWS_MANAGE')")
    public ApiResponse<Void> delete(@PathVariable UUID id, @RequestParam(defaultValue = "false") boolean permanent) {
        newsService.deleteNews(id, permanent);
        return ApiResponse.<Void>builder()
                .success(true)
                .message(permanent ? "Đã xóa vĩnh viễn bài viết" : "Đã ẩn bài viết thành công")
                .timestamp(LocalDateTime.now())
                .build();
    }

    private UUID currentProfileId(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof UserPrincipal principal)) {
            return null;
        }
        return principal.getProfile().getId();
    }
}
/*
 * Example cURL:
 * 1. POST /admin/news
 * curl -X POST "http://localhost:8080/admin/news" -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" -d '{"title":"Khuyễn mãi Mùa Hè","content":"Nội dung khuyến mãi...","category":"PROMOTION","isPublished":true}'
 */
