package ptithcm.tttnd35backend.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import ptithcm.tttnd35backend.util.enums.PaymentMethod;

import java.util.List;

// Đặt hàng không cần đăng nhập - tự nhập toàn bộ thông tin, không qua Cart.
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GuestOrderCreateRequest {

    @NotBlank(message = "Vui lòng nhập họ tên")
    private String customerName;

    @Email(message = "Email không hợp lệ")
    private String customerEmail;

    @NotBlank(message = "Vui lòng nhập số điện thoại")
    private String customerPhone;

    @NotBlank(message = "Vui lòng nhập địa chỉ giao hàng")
    private String shippingAddress;

    @NotEmpty(message = "Đơn hàng phải có ít nhất 1 sản phẩm")
    @Valid
    private List<OrderItemRequest> items;

    private String voucherCode;

    @NotNull(message = "Vui lòng chọn phương thức thanh toán")
    private PaymentMethod paymentMethod;
}
