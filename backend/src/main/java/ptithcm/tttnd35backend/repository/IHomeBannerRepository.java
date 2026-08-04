package ptithcm.tttnd35backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import ptithcm.tttnd35backend.entity.HomeBanner;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface IHomeBannerRepository extends JpaRepository<HomeBanner, UUID> {

    @Query("SELECT b FROM HomeBanner b WHERE b.isActive = true " +
           "AND (b.startAt IS NULL OR b.startAt <= :now) " +
           "AND (b.endAt IS NULL OR b.endAt >= :now) " +
           "ORDER BY b.sortOrder ASC")
    List<HomeBanner> findActiveBanners(LocalDateTime now);

    List<HomeBanner> findAllByOrderBySortOrderAsc();
}
