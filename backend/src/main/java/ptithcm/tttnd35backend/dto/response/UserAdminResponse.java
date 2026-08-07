package ptithcm.tttnd35backend.dto.response;

import lombok.Builder;
import lombok.Data;
import ptithcm.tttnd35backend.util.enums.AuthProvider;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class UserAdminResponse {
    private UUID id;
    private String email;
    private String fullName;
    private String phoneNumber;
    private AuthProvider authProvider;
    private UUID roleId;
    private String roleName;
    private boolean isActive;
    private boolean emailVerified;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
