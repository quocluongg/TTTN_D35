package ptithcm.tttnd35backend.dto.request;

import jakarta.validation.constraints.Size;
import java.util.UUID;

public record UserUpdateRequest(
        @Size(max = 150, message = "Họ tên tối đa 150 ký tự")
        String fullName,

        String phoneNumber,
        UUID roleId
) {}
