package ptithcm.tttnd35backend.repository.spec;

import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;
import ptithcm.tttnd35backend.entity.News;
import ptithcm.tttnd35backend.util.enums.NewsCategory;

public class NewsSpecifications {

    public static Specification<News> withFilter(NewsCategory category, String search, Boolean isPublished) {
        return (root, query, cb) -> {
            var predicate = cb.conjunction();

            if (category != null) {
                predicate = cb.and(predicate, cb.equal(root.get("category"), category));
            }

            if (isPublished != null) {
                predicate = cb.and(predicate, cb.equal(root.get("isPublished"), isPublished));
            }

            if (StringUtils.hasText(search)) {
                String keyword = "%" + search.trim().toLowerCase() + "%";
                predicate = cb.and(predicate, cb.or(
                        cb.like(cb.lower(root.get("title")), keyword),
                        cb.like(cb.lower(root.get("excerpt")), keyword)
                ));
            }

            return predicate;
        };
    }
}
