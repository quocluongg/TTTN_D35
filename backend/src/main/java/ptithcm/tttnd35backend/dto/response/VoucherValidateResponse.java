package ptithcm.tttnd35backend.dto.response;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VoucherValidateResponse {
    private String code;
    private BigDecimal discountAmount;
}
