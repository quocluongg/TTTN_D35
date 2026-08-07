package ptithcm.tttnd35backend.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.UUID;

public record WarrantyCardRequest(
        UUID orderId,
        UUID orderItemId,

        @NotBlank(message = "Tên khách hàng không được để trống")
        String customerName,

        @NotBlank(message = "Số điện thoại không được để trống")
        String customerPhone,

        String customerEmail,

        @NotBlank(message = "Tên sản phẩm không được để trống")
        String productName,

        String serialNumber,

        @NotNull(message = "Ngày mua không được để trống")
        LocalDate purchaseDate,

        @NotNull(message = "Số tháng bảo hành không được để trống")
        @Min(value = 1, message = "Số tháng bảo hành tối thiểu là 1")
        Integer warrantyMonths,

        String notes
) {}
