package ptithcm.tttnd35backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import ptithcm.tttnd35backend.entity.SensitiveQuestion;

import java.util.UUID;

public interface ISensitiveQuestionRepository extends JpaRepository<SensitiveQuestion, UUID>, JpaSpecificationExecutor<SensitiveQuestion> {
    boolean existsByPattern(String pattern);
}