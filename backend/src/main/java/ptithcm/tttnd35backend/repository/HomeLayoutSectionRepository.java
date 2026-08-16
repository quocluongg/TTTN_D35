package ptithcm.tttnd35backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ptithcm.tttnd35backend.entity.HomeLayoutSection;

import java.util.List;
import java.util.UUID;

@Repository
public interface HomeLayoutSectionRepository extends JpaRepository<HomeLayoutSection, UUID> {

    List<HomeLayoutSection> findAllByEnabledTrueOrderByDisplayOrderAsc();

    List<HomeLayoutSection> findAllByOrderByDisplayOrderAsc();
}
