package ptithcm.tttnd35backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

/**
 * Cập nhật thông tin cá nhân (KHÔNG gồm email/password - đổi email/password có luồng riêng
 * để tránh lẫn với OTP/reset password). Các cờ thông báo để null nếu không muốn đổi (partial update).
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProfileRequest {

    @NotBlank(message = "Họ tên không được để trống")
    @Size(max = 150, message = "Họ tên tối đa 150 ký tự")
    private String fullName;

    private Boolean emailNotif;
    private Boolean pushNotif;
    private Boolean systemNotif;
}
