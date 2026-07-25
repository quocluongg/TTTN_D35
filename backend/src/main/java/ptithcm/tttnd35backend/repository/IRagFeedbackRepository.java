package ptithcm.tttnd35backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ptithcm.tttnd35backend.entity.RagFeedback;

import java.util.UUID;

@Repository
public interface IRagFeedbackRepository extends JpaRepository<RagFeedback, UUID> {
    long countByRating(int rating);
}
