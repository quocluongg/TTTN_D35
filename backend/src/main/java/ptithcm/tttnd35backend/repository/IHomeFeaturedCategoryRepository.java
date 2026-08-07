package ptithcm.tttnd35backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ptithcm.tttnd35backend.entity.HomeFeaturedCategory;

import java.util.List;
import java.util.UUID;

public interface IHomeFeaturedCategoryRepository extends JpaRepository<HomeFeaturedCategory, UUID> {

    List<HomeFeaturedCategory> findByIsActiveTrueOrderBySortOrderAsc();

    List<HomeFeaturedCategory> findAllByOrderBySortOrderAsc();
}
