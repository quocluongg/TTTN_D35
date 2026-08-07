package ptithcm.tttnd35backend.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import ptithcm.tttnd35backend.dto.request.NewsRequest;
import ptithcm.tttnd35backend.dto.response.NewsResponse;
import ptithcm.tttnd35backend.entity.News;

import java.util.List;

@Mapper(componentModel = "spring")
public interface INewsMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "slug", ignore = true)
    @Mapping(target = "author", ignore = true)
    @Mapping(target = "viewCount", ignore = true)
    @Mapping(target = "publishedAt", ignore = true)
    News toEntity(NewsRequest request);

    @Mapping(target = "authorId", source = "author.id")
    @Mapping(target = "authorName", source = "author.fullName")
    NewsResponse toResponse(News news);

    List<NewsResponse> toResponseList(List<News> newsList);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "slug", ignore = true)
    @Mapping(target = "author", ignore = true)
    @Mapping(target = "viewCount", ignore = true)
    @Mapping(target = "publishedAt", ignore = true)
    void updateEntityFromRequest(NewsRequest request, @MappingTarget News news);
}
