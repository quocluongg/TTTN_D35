package ptithcm.tttnd35backend.repository.projection;

import java.math.BigDecimal;
import java.util.UUID;

/** Kết quả aggregate MIN(price) theo productId, dùng để tính priceFrom mà không phải load hết variants. */
public interface ProductMinPriceProjection {
    UUID getProductId();
    BigDecimal getMinPrice();
}
