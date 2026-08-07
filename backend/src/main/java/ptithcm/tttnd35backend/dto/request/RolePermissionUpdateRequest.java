package ptithcm.tttnd35backend.dto.request;

import jakarta.validation.constraints.NotNull;
import java.util.List;

public record RolePermissionUpdateRequest(
        @NotNull(message = "Danh sách mã quyền không được để trống")
        List<String> permissionCodes
) {}
