package ptithcm.tttnd35backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ptithcm.tttnd35backend.entity.AddToCartEvent;

import java.util.UUID;

public interface IAddToCartEventRepository extends JpaRepository<AddToCartEvent, UUID> {
}
