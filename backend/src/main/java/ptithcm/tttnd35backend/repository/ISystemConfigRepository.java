package ptithcm.tttnd35backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ptithcm.tttnd35backend.entity.SystemConfig;
public interface ISystemConfigRepository extends JpaRepository<SystemConfig, String> {}
