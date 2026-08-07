package ptithcm.tttnd35backend.dto.request;

import jakarta.validation.constraints.NotNull;

public record UserLockRequest(
        @NotNull(message = "Trạng thái isActive không được để trống")
        Boolean isActive
) {}
