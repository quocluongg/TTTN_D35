package ptithcm.tttnd35backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ptithcm.tttnd35backend.entity.OrderItem;

import java.util.List;
import java.util.UUID;

public interface IOrderItemRepository extends JpaRepository<OrderItem, UUID> {

    List<OrderItem> findAllByOrderId(UUID orderId);

    List<OrderItem> findAllByOrderIdIn(List<UUID> orderIds);
}
