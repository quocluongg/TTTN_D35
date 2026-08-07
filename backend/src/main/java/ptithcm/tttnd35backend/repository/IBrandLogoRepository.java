package ptithcm.tttnd35backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ptithcm.tttnd35backend.entity.BrandLogo;

import java.util.List;
import java.util.UUID;

public interface IBrandLogoRepository extends JpaRepository<BrandLogo, UUID> {

    List<BrandLogo> findByIsActiveTrueOrderBySortOrderAsc();

    List<BrandLogo> findAllByOrderBySortOrderAsc();
}
