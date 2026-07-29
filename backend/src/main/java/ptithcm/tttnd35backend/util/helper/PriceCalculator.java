package ptithcm.tttnd35backend.util.helper;

import ptithcm.tttnd35backend.util.enums.DiscountType;

import java.math.BigDecimal;
import java.math.RoundingMode;

// Dùng chung cho Campaign, Voucher, Order
public class PriceCalculator {

    private PriceCalculator() {
    }

    public static BigDecimal applyDiscount(BigDecimal originalPrice, DiscountType type, BigDecimal value) {
        BigDecimal result = type == DiscountType.PERCENT
                ? originalPrice.multiply(BigDecimal.ONE.subtract(value.divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP)))
                : originalPrice.subtract(value);
        return result.max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
    }
}
