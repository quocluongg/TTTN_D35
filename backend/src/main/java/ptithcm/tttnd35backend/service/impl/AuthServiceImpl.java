package ptithcm.tttnd35backend.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ptithcm.tttnd35backend.dto.request.RegisterRequest;
import ptithcm.tttnd35backend.dto.request.VerifyOtpRequest;
import ptithcm.tttnd35backend.entity.Profile;
import ptithcm.tttnd35backend.entity.Role;
import ptithcm.tttnd35backend.exception.BadRequestException;
import ptithcm.tttnd35backend.exception.DuplicateResourceException;
import ptithcm.tttnd35backend.exception.ResourceNotFoundException;
import ptithcm.tttnd35backend.repository.IProfileRepository;
import ptithcm.tttnd35backend.repository.IRoleRepository;
import ptithcm.tttnd35backend.service.IAuthService;
import ptithcm.tttnd35backend.util.enums.AuthProvider;
import ptithcm.tttnd35backend.util.enums.OtpPurpose;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements IAuthService {

    private static final String DEFAULT_ROLE = "CUSTOMER";

    private final IProfileRepository profileRepository;
    private final IRoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final OtpServiceImpl otpService;

    @Override
    @Transactional
    public void register(RegisterRequest request) {
        if (profileRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email đã được sử dụng");
        }

        Role customerRole = roleRepository.findByName(DEFAULT_ROLE)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Chưa seed role mặc định '" + DEFAULT_ROLE + "'"));

        Profile profile = Profile.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .authProvider(AuthProvider.LOCAL)
                .role(customerRole)
                .fullName(request.getFullName())
                .emailVerified(false)
                .isActive(true)
                .build();

        profile = profileRepository.save(profile);

        otpService.generateAndSend(profile, OtpPurpose.REGISTER);
    }

    @Override
    @Transactional
    public void verifyOtp(VerifyOtpRequest request) {
        Profile profile = profileRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản với email này"));

        if (profile.isEmailVerified()) {
            throw new BadRequestException("Email này đã được xác thực trước đó");
        }

        otpService.verify(profile, request.getOtp(), OtpPurpose.REGISTER);

        profile.setEmailVerified(true);
        profileRepository.save(profile);
    }

    @Override
    @Transactional
    public void resendRegisterOtp(String email) {
        Profile profile = profileRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản với email này"));

        if (profile.isEmailVerified()) {
            throw new BadRequestException("Email này đã được xác thực trước đó");
        }

        otpService.generateAndSend(profile, OtpPurpose.REGISTER);
    }
}
