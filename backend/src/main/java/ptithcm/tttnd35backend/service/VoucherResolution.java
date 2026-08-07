package ptithcm.tttnd35backend.service;

import lombok.AllArgsConstructor;
import lombok.Getter;
import ptithcm.tttnd35backend.entity.Voucher;

import java.math.BigDecimal;

// Kết quả resolve voucher lúc tạo Order - trả luôn entity để OrderService dùng id ghi VoucherUsage,
// không phải query lại DB.
@Getter
@AllArgsConstructor
public class VoucherResolution {
    private final Voucher voucher;
    private final BigDecimal discountAmount;
}
