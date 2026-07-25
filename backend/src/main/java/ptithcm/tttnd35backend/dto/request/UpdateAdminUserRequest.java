package ptithcm.tttnd35backend.dto.request;

import jakarta.validation.constraints.Size;

public record UpdateAdminUserRequest(
        @Size(min = 2, max = 150) String fullName,
        String role,
        @Size(max = 30) String phone,
        Boolean active,
        @Size(max = 500) String lockReason) { }
