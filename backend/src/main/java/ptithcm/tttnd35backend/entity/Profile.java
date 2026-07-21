package ptithcm.tttnd35backend.entity;

import jakarta.persistence.*;
import lombok.*;
import ptithcm.tttnd35backend.util.enums.AuthProvider;

import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "profiles")
public class Profile extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    // Nếu đăng nhập bằng Google/Facebook = null
    @Column(name = "password_hash")
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(name = "auth_provider", nullable = false, length = 20)
    @Builder.Default
    private AuthProvider authProvider = AuthProvider.LOCAL;

    @Column(name = "provider_user_id")
    private String providerUserId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;

    @Column(name = "full_name", length = 150)
    private String fullName;

    @Builder.Default
    @Column(name = "email_notif")
    private boolean emailNotif = true;

    @Builder.Default
    @Column(name = "push_notif")
    private boolean pushNotif = true;

    @Builder.Default
    @Column(name = "system_notif")
    private boolean systemNotif = true;

    @Builder.Default
    @Column(name = "is_active")
    private boolean isActive = true;
}
