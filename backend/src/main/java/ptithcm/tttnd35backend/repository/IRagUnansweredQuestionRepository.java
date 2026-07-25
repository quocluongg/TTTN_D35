package ptithcm.tttnd35backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ptithcm.tttnd35backend.entity.RagUnansweredQuestion;

import java.util.UUID;

@Repository
public interface IRagUnansweredQuestionRepository extends JpaRepository<RagUnansweredQuestion, UUID> {
}
