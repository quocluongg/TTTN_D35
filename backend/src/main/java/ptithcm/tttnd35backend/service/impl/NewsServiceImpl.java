package ptithcm.tttnd35backend.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import ptithcm.tttnd35backend.dto.request.NewsRequest;
import ptithcm.tttnd35backend.dto.response.NewsResponse;
import ptithcm.tttnd35backend.dto.response.pagination.PageResponse;
import ptithcm.tttnd35backend.dto.response.pagination.PaginationMeta;
import ptithcm.tttnd35backend.entity.News;
import ptithcm.tttnd35backend.entity.Profile;
import ptithcm.tttnd35backend.exception.ResourceNotFoundException;
import ptithcm.tttnd35backend.mapper.INewsMapper;
import ptithcm.tttnd35backend.repository.INewsRepository;
import ptithcm.tttnd35backend.repository.IProfileRepository;
import ptithcm.tttnd35backend.repository.spec.NewsSpecifications;
import ptithcm.tttnd35backend.service.INewsService;
import ptithcm.tttnd35backend.util.enums.NewsCategory;
import ptithcm.tttnd35backend.util.helper.SlugUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class NewsServiceImpl implements INewsService {

    private final INewsRepository newsRepository;
    private final IProfileRepository profileRepository;
    private final INewsMapper newsMapper;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<NewsResponse> getPublicNews(NewsCategory category, String search, Pageable pageable) {
        var spec = NewsSpecifications.withFilter(category, search, true);
        var page = newsRepository.findAll(spec, pageable);
        return PageResponse.<NewsResponse>builder()
                .items(newsMapper.toResponseList(page.getContent()))
                .pagination(PaginationMeta.builder()
                        .currentPage(page.getNumber())
                        .pageSize(page.getSize())
                        .totalPages(page.getTotalPages())
                        .totalItems(page.getTotalElements())
                        .build())
                .build();
    }

    @Override
    public NewsResponse getNewsBySlug(String slug) {
        var news = newsRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài viết với slug: " + slug));

        if (!news.isPublished()) {
            throw new ResourceNotFoundException("Bài viết chưa được xuất bản");
        }

        newsRepository.incrementViewCount(news.getId());
        news.setViewCount(news.getViewCount() + 1);
        return newsMapper.toResponse(news);
    }

    @Override
    @Transactional(readOnly = true)
    public List<NewsResponse> getRecentNews(int limit) {
        return newsMapper.toResponseList(newsRepository.findTop5ByIsPublishedTrueOrderByPublishedAtDesc());
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<NewsResponse> getAdminNews(NewsCategory category, String search, Boolean isPublished, Pageable pageable) {
        var spec = NewsSpecifications.withFilter(category, search, isPublished);
        var page = newsRepository.findAll(spec, pageable);
        return PageResponse.<NewsResponse>builder()
                .items(newsMapper.toResponseList(page.getContent()))
                .pagination(PaginationMeta.builder()
                        .currentPage(page.getNumber())
                        .pageSize(page.getSize())
                        .totalPages(page.getTotalPages())
                        .totalItems(page.getTotalElements())
                        .build())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public NewsResponse getNewsById(UUID id) {
        var news = newsRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài viết với id: " + id));
        return newsMapper.toResponse(news);
    }

    @Override
    public NewsResponse createNews(NewsRequest request, UUID currentUserId) {
        News news = newsMapper.toEntity(request);

        String slug = generateUniqueSlug(request.title(), request.slug(), null);
        news.setSlug(slug);

        if (currentUserId != null) {
            Profile author = profileRepository.findById(currentUserId).orElse(null);
            news.setAuthor(author);
        }

        boolean isPublished = Boolean.TRUE.equals(request.isPublished());
        news.setPublished(isPublished);
        if (isPublished) {
            news.setPublishedAt(LocalDateTime.now());
        }

        News saved = newsRepository.save(news);
        log.info("Created news: id={}, title={}, isPublished={}", saved.getId(), saved.getTitle(), saved.isPublished());
        return newsMapper.toResponse(saved);
    }

    @Override
    public NewsResponse updateNews(UUID id, NewsRequest request) {
        News news = newsRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài viết với id: " + id));

        newsMapper.updateEntityFromRequest(request, news);

        if (StringUtils.hasText(request.slug()) && !request.slug().equals(news.getSlug())) {
            news.setSlug(generateUniqueSlug(request.title(), request.slug(), id));
        }

        if (request.isPublished() != null) {
            boolean isPublished = Boolean.TRUE.equals(request.isPublished());
            if (isPublished && !news.isPublished()) {
                news.setPublishedAt(LocalDateTime.now());
            }
            news.setPublished(isPublished);
        }

        News updated = newsRepository.save(news);
        log.info("Updated news: id={}, title={}", updated.getId(), updated.getTitle());
        return newsMapper.toResponse(updated);
    }

    @Override
    public NewsResponse updatePublishStatus(UUID id, boolean isPublished) {
        News news = newsRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài viết với id: " + id));

        if (isPublished && !news.isPublished()) {
            news.setPublishedAt(LocalDateTime.now());
        }
        news.setPublished(isPublished);
        return newsMapper.toResponse(newsRepository.save(news));
    }

    @Override
    public void deleteNews(UUID id, boolean permanent) {
        News news = newsRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài viết với id: " + id));

        if (permanent) {
            newsRepository.delete(news);
            log.info("Permanently deleted news id={}", id);
        } else {
            news.setPublished(false);
            newsRepository.save(news);
            log.info("Soft deleted (unpublished) news id={}", id);
        }
    }

    private String generateUniqueSlug(String title, String requestedSlug, UUID excludeId) {
        String baseSlug = StringUtils.hasText(requestedSlug) ? SlugUtils.toSlug(requestedSlug) : SlugUtils.toSlug(title);
        String candidate = baseSlug;
        int count = 1;

        while (excludeId == null ? newsRepository.existsBySlug(candidate) : newsRepository.existsBySlugAndIdNot(candidate, excludeId)) {
            candidate = baseSlug + "-" + count++;
        }
        return candidate;
    }
}
