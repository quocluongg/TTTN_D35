package ptithcm.tttnd35backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ptithcm.tttnd35backend.entity.Campaign;

import java.util.List;
import java.util.UUID;

public interface ICampaignRepository extends JpaRepository<Campaign, UUID> {

    List<Campaign> findAllByOrderByStartTimeDesc();
}
