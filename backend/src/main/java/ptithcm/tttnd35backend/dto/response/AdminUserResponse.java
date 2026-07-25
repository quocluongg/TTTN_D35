package ptithcm.tttnd35backend.dto.response;

import lombok.Builder;
import java.time.LocalDateTime;
import java.util.UUID;
@Builder
public record AdminUserResponse(UUID id, String email, String fullName, String phone, String role,
                                boolean active, boolean emailVerified, String lockReason,
                                LocalDateTime createdAt, LocalDateTime updatedAt) { }
