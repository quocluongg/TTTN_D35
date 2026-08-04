package ptithcm.tttnd35backend.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ptithcm.tttnd35backend.dto.request.UserCreateRequest;
import ptithcm.tttnd35backend.dto.request.UserLockRequest;
import ptithcm.tttnd35backend.dto.request.UserUpdateRequest;
import ptithcm.tttnd35backend.dto.response.UserAdminResponse;
import ptithcm.tttnd35backend.dto.response.pagination.PageResponse;
import ptithcm.tttnd35backend.dto.response.pagination.PaginationMeta;
import ptithcm.tttnd35backend.entity.Profile;
import ptithcm.tttnd35backend.entity.Role;
import ptithcm.tttnd35backend.exception.BadRequestException;
import ptithcm.tttnd35backend.exception.ResourceNotFoundException;
import ptithcm.tttnd35backend.mapper.IAdminUserMapper;
import ptithcm.tttnd35backend.repository.IProfileRepository;
import ptithcm.tttnd35backend.repository.IRoleRepository;
import ptithcm.tttnd35backend.repository.spec.UserSpecifications;
import ptithcm.tttnd35backend.service.IAdminUserService;
import ptithcm.tttnd35backend.service.IMailService;
import ptithcm.tttnd35backend.util.enums.AuthProvider;

import java.security.SecureRandom;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class AdminUserServiceImpl implements IAdminUserService {

    private final IProfileRepository profileRepository;
    private final IRoleRepository roleRepository;
    private final IAdminUserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final IMailService mailService;

    private static final String ALPHA_NUMERIC = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    private final SecureRandom random = new SecureRandom();

    @Override
    @Transactional(readOnly = true)
    public PageResponse<UserAdminResponse> getUsers(String roleName, Boolean isActive, String search, Pageable pageable) {
        var spec = UserSpecifications.withFilter(roleName, isActive, search);
        var page = profileRepository.findAll(spec, pageable);

        return PageResponse.<UserAdminResponse>builder()
                .items(userMapper.toResponseList(page.getContent()))
                .pagination(PaginationMeta.builder()
                        .currentPage(page.getNumber())
                        .pageSize(page.getSize())
                        .totalPages(page.getTotalPages())
                        .totalItems(page.getTotalElements())
                        .build())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public UserAdminResponse getUserById(UUID id) {
        Profile profile = profileRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản với id: " + id));
        return userMapper.toResponse(profile);
    }

    @Override
    public UserAdminResponse createUser(UserCreateRequest request) {
        if (profileRepository.existsByEmail(request.email())) {
            throw new BadRequestException("Email " + request.email() + " đã được sử dụng");
        }

        Role role = roleRepository.findById(request.roleId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy vai trò với id: " + request.roleId()));

        String tempPassword = generateRandomPassword(12);
        String passwordHash = passwordEncoder.encode(tempPassword);

        Profile profile = Profile.builder()
                .email(request.email())
                .passwordHash(passwordHash)
                .authProvider(AuthProvider.LOCAL)
                .role(role)
                .fullName(request.fullName())
                .phoneNumber(request.phoneNumber())
                .isActive(true)
                .emailVerified(true)
                .build();

        Profile saved = profileRepository.save(profile);
        log.info("Created new user: id={}, email={}, role={}", saved.getId(), saved.getEmail(), role.getName());

        mailService.sendStaffAccountCreatedEmail(saved.getEmail(), tempPassword);

        return userMapper.toResponse(saved);
    }

    @Override
    public UserAdminResponse updateUser(UUID id, UserUpdateRequest request) {
        Profile profile = profileRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản với id: " + id));

        if (request.fullName() != null) profile.setFullName(request.fullName());
        if (request.phoneNumber() != null) profile.setPhoneNumber(request.phoneNumber());

        if (request.roleId() != null && !request.roleId().equals(profile.getRole().getId())) {
            Role role = roleRepository.findById(request.roleId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy vai trò với id: " + request.roleId()));
            profile.setRole(role);
        }

        return userMapper.toResponse(profileRepository.save(profile));
    }

    @Override
    public UserAdminResponse lockUser(UUID id, UserLockRequest request) {
        Profile profile = profileRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản với id: " + id));

        if ("ADMIN".equalsIgnoreCase(profile.getRole().getName()) && !request.isActive()) {
            throw new BadRequestException("Không thể khóa tài khoản quản trị viên tối cao (ADMIN)");
        }

        profile.setActive(request.isActive());
        Profile updated = profileRepository.save(profile);
        log.info("Updated user status: id={}, isActive={}", updated.getId(), updated.isActive());
        return userMapper.toResponse(updated);
    }

    private String generateRandomPassword(int length) {
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(ALPHA_NUMERIC.charAt(random.nextInt(ALPHA_NUMERIC.length())));
        }
        return sb.toString();
    }
}
