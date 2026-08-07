package ptithcm.tttnd35backend.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import ptithcm.tttnd35backend.entity.News;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface INewsRepository extends JpaRepository<News, UUID>, JpaSpecificationExecutor<News> {

    Optional<News> findBySlug(String slug);

    boolean existsBySlug(String slug);

    boolean existsBySlugAndIdNot(String slug, UUID id);

    @Modifying
    @Query("UPDATE News n SET n.viewCount = n.viewCount + 1 WHERE n.id = :id")
    void incrementViewCount(@Param("id") UUID id);

    List<News> findTop5ByIsPublishedTrueOrderByPublishedAtDesc();
}
