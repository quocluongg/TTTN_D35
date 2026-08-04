package ptithcm.tttnd35backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ptithcm.tttnd35backend.entity.HomeFeaturedCategoryItem;

import java.util.List;
import java.util.UUID;

public interface IHomeFeaturedCategoryItemRepository extends JpaRepository<HomeFeaturedCategoryItem, UUID> {

    List<HomeFeaturedCategoryItem> findByFeaturedCategoryIdOrderBySortOrderAsc(UUID featuredCategoryId);

    void deleteByFeaturedCategoryId(UUID featuredCategoryId);
}
