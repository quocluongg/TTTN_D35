package ptithcm.tttnd35backend.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ptithcm.tttnd35backend.dto.request.RolePermissionUpdateRequest;
import ptithcm.tttnd35backend.dto.response.PermissionResponse;
import ptithcm.tttnd35backend.dto.response.RoleResponse;
import ptithcm.tttnd35backend.entity.Permission;
import ptithcm.tttnd35backend.entity.Role;
import ptithcm.tttnd35backend.entity.RolePermission;
import ptithcm.tttnd35backend.entity.RolePermissionId;
import ptithcm.tttnd35backend.exception.BadRequestException;
import ptithcm.tttnd35backend.exception.ResourceNotFoundException;
import ptithcm.tttnd35backend.mapper.IAdminRoleMapper;
import ptithcm.tttnd35backend.repository.IPermissionRepository;
import ptithcm.tttnd35backend.repository.IRolePermissionRepository;
import ptithcm.tttnd35backend.repository.IRoleRepository;
import ptithcm.tttnd35backend.service.IAdminRoleService;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class AdminRoleServiceImpl implements IAdminRoleService {

    private final IRoleRepository roleRepository;
    private final IPermissionRepository permissionRepository;
    private final IRolePermissionRepository rolePermissionRepository;
    private final IAdminRoleMapper roleMapper;

    @Override
    @Transactional(readOnly = true)
    public List<RoleResponse> getAllRoles() {
        List<Role> roles = roleRepository.findAll();
        return roles.stream().map(this::mapRoleWithPermissions).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public RoleResponse getRoleById(UUID id) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy vai trò với id: " + id));
        return mapRoleWithPermissions(role);
    }

    @Override
    public RoleResponse updateRolePermissions(UUID roleId, RolePermissionUpdateRequest request) {
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy vai trò với id: " + roleId));

        if ("ADMIN".equalsIgnoreCase(role.getName())) {
            throw new BadRequestException("Không được phép chỉnh sửa quyền hạn của vai trò quản trị viên tối cao (ADMIN)");
        }

        rolePermissionRepository.deleteByRoleId(roleId);

        if (request.permissionCodes() != null && !request.permissionCodes().isEmpty()) {
            List<RolePermission> newPermissions = new ArrayList<>();
            for (String code : request.permissionCodes()) {
                Permission perm = permissionRepository.findByCode(code)
                        .orElseThrow(() -> new BadRequestException("Không tìm thấy quyền hạn có mã: " + code));

                RolePermission rp = RolePermission.builder()
                        .id(new RolePermissionId(roleId, perm.getId()))
                        .role(role)
                        .permission(perm)
                        .build();
                newPermissions.add(rp);
            }
            rolePermissionRepository.saveAll(newPermissions);
        }

        log.info("Updated permissions for role id={}, name={}", role.getId(), role.getName());
        return mapRoleWithPermissions(roleRepository.findById(roleId).orElse(role));
    }

    @Override
    @Transactional(readOnly = true)
    public List<PermissionResponse> getAllPermissions() {
        return roleMapper.toPermissionResponseList(permissionRepository.findAll());
    }

    private RoleResponse mapRoleWithPermissions(Role role) {
        RoleResponse res = roleMapper.toResponse(role);
        List<Permission> perms = role.getRolePermissions() != null
                ? role.getRolePermissions().stream().map(RolePermission::getPermission).toList()
                : List.of();
        res.setPermissions(roleMapper.toPermissionResponseList(perms));
        return res;
    }
}
