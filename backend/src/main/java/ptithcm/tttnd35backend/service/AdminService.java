package ptithcm.tttnd35backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ptithcm.tttnd35backend.dto.request.AdminUserRequest;
import ptithcm.tttnd35backend.dto.request.UpdateAdminUserRequest;
import ptithcm.tttnd35backend.dto.response.AdminUserResponse;
import ptithcm.tttnd35backend.dto.response.pagination.PageResponse;
import ptithcm.tttnd35backend.entity.*;
import ptithcm.tttnd35backend.exception.BadRequestException;
import ptithcm.tttnd35backend.exception.DuplicateResourceException;
import ptithcm.tttnd35backend.exception.ResourceNotFoundException;
import ptithcm.tttnd35backend.repository.*;
import ptithcm.tttnd35backend.util.enums.AuthProvider;
import ptithcm.tttnd35backend.util.helper.PageResponseHelper;

import java.util.*;

@Service
@RequiredArgsConstructor
public class AdminService {
    private static final Set<String> SYSTEM_ROLES = Set.of("ADMIN", "MANAGER", "STAFF", "CUSTOMER");
    private final IProfileRepository profiles;
    private final IRoleRepository roles;
    private final IAuditLogRepository auditLogs;
    private final ISystemConfigRepository configs;
    private final PasswordEncoder encoder;

    @Transactional(readOnly = true)
    public PageResponse<AdminUserResponse> users(String search, String role, Boolean active, int page, int size) {
        Page<Profile> result = profiles.search(blankToNull(search), blankToNull(role), active,
                PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100), Sort.by(Sort.Direction.DESC, "createdAt")));
        return PageResponseHelper.toPageResponse(result.map(this::toResponse));
    }

    @Transactional(readOnly = true)
    public AdminUserResponse user(UUID id) { return toResponse(findProfile(id)); }

    @Transactional
    public AdminUserResponse createUser(AdminUserRequest request, Profile actor) {
        if (profiles.existsByEmail(request.email().trim().toLowerCase())) throw new DuplicateResourceException("Email đã được sử dụng");
        Role role = findRole(request.role());
        if ("ADMIN".equals(role.getName()) && !isAdmin(actor)) throw new BadRequestException("Chỉ ADMIN được tạo ADMIN");
        Profile saved = profiles.save(Profile.builder().email(request.email().trim().toLowerCase())
                .fullName(request.fullName().trim()).phone(blankToNull(request.phone())).role(role)
                .passwordHash(encoder.encode(request.password())).authProvider(AuthProvider.LOCAL)
                .emailVerified(true).isActive(true).build());
        audit(actor, "USER_CREATE", "PROFILE", saved.getId().toString(), "Tạo tài khoản " + saved.getEmail());
        return toResponse(saved);
    }

    @Transactional
    public AdminUserResponse updateUser(UUID id, UpdateAdminUserRequest request, Profile actor) {
        Profile target = findProfile(id);
        if (target.getId().equals(actor.getId()) && Boolean.FALSE.equals(request.active())) throw new BadRequestException("Không thể tự khóa tài khoản của mình");
        if (request.fullName() != null) target.setFullName(request.fullName().trim());
        if (request.phone() != null) target.setPhone(blankToNull(request.phone()));
        if (request.role() != null) {
            Role newRole = findRole(request.role());
            if ("ADMIN".equals(newRole.getName()) && !isAdmin(actor)) throw new BadRequestException("Chỉ ADMIN được gán role ADMIN");
            if ("ADMIN".equals(target.getRole().getName()) && !isAdmin(actor)) throw new BadRequestException("Chỉ ADMIN được sửa tài khoản ADMIN");
            target.setRole(newRole);
        }
        if (request.active() != null) { target.setActive(request.active()); target.setLockedReason(request.active() ? null : blankToNull(request.lockReason())); }
        Profile saved = profiles.save(target);
        audit(actor, "USER_UPDATE", "PROFILE", id.toString(), "Cập nhật tài khoản " + target.getEmail());
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> roles() {
        return roles.findAll(Sort.by("name")).stream().map(role -> Map.<String,Object>of(
                "id", role.getId(), "name", role.getName(), "description", Optional.ofNullable(role.getDescription()).orElse(""),
                "system", SYSTEM_ROLES.contains(role.getName()),
                "permissions", role.getRolePermissions().stream().map(rp -> rp.getPermission().getCode()).sorted().toList())).toList();
    }

    @Transactional(readOnly = true)
    public List<SystemConfig> configs() { return configs.findAll(Sort.by("key")); }

    @Transactional(readOnly = true)
    public PageResponse<Map<String, Object>> auditLogs(int page, int size) {
        Page<AuditLog> logs = auditLogs.findAll(PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100), Sort.by(Sort.Direction.DESC, "createdAt")));
        return PageResponseHelper.toPageResponse(logs.map(log -> {
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("id", log.getId()); result.put("action", log.getAction()); result.put("entityType", log.getEntityType());
            result.put("entityId", log.getEntityId()); result.put("summary", log.getSummary()); result.put("createdAt", log.getCreatedAt());
            result.put("actorEmail", log.getActor() == null ? null : log.getActor().getEmail()); return result;
        }));
    }

    @Transactional
    public SystemConfig updateConfig(String key, String value, Profile actor) {
        SystemConfig config = configs.findById(key).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy cấu hình: " + key));
        config.setValue(value.trim()); config.setUpdatedBy(actor);
        SystemConfig saved = configs.save(config);
        audit(actor, "SYSTEM_CONFIG_UPDATE", "SYSTEM_CONFIG", key, "Cập nhật cấu hình " + key);
        return saved;
    }

    @Transactional
    public void audit(Profile actor, String action, String entityType, String entityId, String summary) {
        auditLogs.save(AuditLog.builder().actor(actor).action(action).entityType(entityType).entityId(entityId).summary(summary).build());
    }
    private Profile findProfile(UUID id) { return profiles.findById(id).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản")); }
    private Role findRole(String name) { return roles.findByName(name.trim().toUpperCase()).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy role")); }
    private boolean isAdmin(Profile profile) { return "ADMIN".equals(profile.getRole().getName()); }
    private String blankToNull(String v) { return v == null || v.isBlank() ? null : v.trim(); }
    private AdminUserResponse toResponse(Profile p) { return AdminUserResponse.builder().id(p.getId()).email(p.getEmail()).fullName(p.getFullName()).phone(p.getPhone()).role(p.getRole().getName()).active(p.isActive()).emailVerified(p.isEmailVerified()).lockReason(p.getLockedReason()).createdAt(p.getCreatedAt()).updatedAt(p.getUpdatedAt()).build(); }
}
