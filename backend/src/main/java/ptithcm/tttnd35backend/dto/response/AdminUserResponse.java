package ptithcm.tttnd35backend.dto.response;

import lombok.Builder;
import java.time.ZonedDateTime;
import java.util.UUID;
@Builder
public record AdminUserResponse(UUID id, String email, String fullName, String phone, String role,
                                boolean active, boolean emailVerified, String lockReason,
                                ZonedDateTime createdAt, ZonedDateTime updatedAt) { }

