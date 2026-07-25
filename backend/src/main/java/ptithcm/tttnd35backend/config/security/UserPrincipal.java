package ptithcm.tttnd35backend.config.security;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import ptithcm.tttnd35backend.entity.Permission;
import ptithcm.tttnd35backend.entity.Profile;
import ptithcm.tttnd35backend.entity.RolePermission;

import java.util.Collection;
import java.util.List;
import java.util.Objects;
import java.util.stream.Stream;

/**
 * Authorities gồm 2 loại, gộp chung 1 danh sách:
 *  - "ROLE_<tên role>"   -> dùng với hasRole("ADMIN")
 *  - "<code permission>" -> dùng với hasAuthority("PRODUCT_CREATE")
 */
public class UserPrincipal implements UserDetails {

    private final Profile profile;

    public UserPrincipal(Profile profile) {
        this.profile = profile;
    }

    public Profile getProfile() {
        return profile;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        if (profile == null || profile.getRole() == null) {
            return List.of();
        }

        Stream<String> roleAuthority = Stream.of("ROLE_" + profile.getRole().getName());

        Collection<RolePermission> rps = profile.getRole().getRolePermissions();
        Stream<String> permissionAuthorities = (rps != null ? rps.stream() : Stream.<RolePermission>empty())
                .map(RolePermission::getPermission)
                .filter(Objects::nonNull)
                .map(Permission::getCode)
                .filter(Objects::nonNull);

        return Stream.concat(roleAuthority, permissionAuthorities)
                .map(SimpleGrantedAuthority::new)
                .toList();
    }

    @Override
    public String getPassword() {
        return profile != null ? profile.getPasswordHash() : null;
    }

    @Override
    public String getUsername() {
        return profile != null ? profile.getEmail() : null;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return profile == null || profile.isActive();
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return profile == null || profile.isActive();
    }
}
