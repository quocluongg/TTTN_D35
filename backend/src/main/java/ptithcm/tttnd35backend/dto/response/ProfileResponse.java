package ptithcm.tttnd35backend.dto.response;

import lombok.*;

import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProfileResponse {
    private UUID id;
    private String email;
    private String fullName;
    private String phoneNumber;
    private String avatarUrl;
    private String role;
    private boolean emailVerified;
    private boolean emailNotif;
    private boolean pushNotif;
    private boolean systemNotif;
}
