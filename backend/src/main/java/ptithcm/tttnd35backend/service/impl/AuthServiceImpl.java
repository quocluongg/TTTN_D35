package ptithcm.tttnd35backend.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ptithcm.tttnd35backend.config.jwt.JwtProvider;
import ptithcm.tttnd35backend.config.security.UserPrincipal;
import ptithcm.tttnd35backend.dto.request.LoginRequest;
import ptithcm.tttnd35backend.dto.request.RegisterRequest;
import ptithcm.tttnd35backend.dto.request.VerifyOtpRequest;
import ptithcm.tttnd35backend.dto.response.AuthResult;
import ptithcm.tttnd35backend.dto.response.TokenResponse;
import ptithcm.tttnd35backend.entity.Profile;
import ptithcm.tttnd35backend.entity.RefreshToken;
import ptithcm.tttnd35backend.entity.Role;
import ptithcm.tttnd35backend.exception.AccountNotVerifiedException;
import ptithcm.tttnd35backend.exception.BadRequestException;
import ptithcm.tttnd35backend.exception.DuplicateResourceException;
import ptithcm.tttnd35backend.exception.ResourceNotFoundException;
import ptithcm.tttnd35backend.repository.IProfileRepository;
import ptithcm.tttnd35backend.repository.IRefreshTokenRepository;
import ptithcm.tttnd35backend.repository.IRoleRepository;
import ptithcm.tttnd35backend.service.IAuthService;
import ptithcm.tttnd35backend.util.enums.AuthProvider;
import ptithcm.tttnd35backend.util.enums.OtpPurpose;
import ptithcm.tttnd35backend.util.helper.TokenHasher;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements IAuthService {

    private static final String DEFAULT_ROLE = "CUSTOMER";

    private final IProfileRepository profileRepository;
    private final IRoleRepository roleRepository;
    private final IRefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final OtpServiceImpl otpService;
    private final JwtProvider jwtProvider;

    @Value("${service.jwt.refresh-expiration}")
    private long refreshExpirationMs;

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

    @Override
    @Transactional
    public AuthResult login(LoginRequest request, String deviceInfo, String ipAddress) {
        Profile profile = profileRepository.findByEmailWithRoleAndPermissions(request.getEmail())
                .orElseThrow(() -> new BadCredentialsException("Email hoặc mật khẩu không chính xác"));

        if (profile.getPasswordHash() == null || !passwordEncoder.matches(request.getPassword(), profile.getPasswordHash())) {
            throw new BadCredentialsException("Email hoặc mật khẩu không chính xác");
        }

        if (!profile.isActive()) {
            throw new BadRequestException("Tài khoản đã bị khóa, vui lòng liên hệ quản trị viên");
        }

        if (!profile.isEmailVerified()) {
            throw new AccountNotVerifiedException("Tài khoản chưa xác thực email, vui lòng kiểm tra hộp thư");
        }

        UserPrincipal principal = new UserPrincipal(profile);
        String accessToken = jwtProvider.generateToken(principal);

        String rawRefreshToken = TokenHasher.generateRawToken();
        RefreshToken refreshToken = RefreshToken.builder()
                .profile(profile)
                .tokenHash(TokenHasher.sha256(rawRefreshToken))
                .deviceInfo(deviceInfo)
                .ipAddress(ipAddress)
                .expiresAt(LocalDateTime.now().plus(refreshExpirationMs, ChronoUnit.MILLIS))
                .revoked(false)
                .build();
        refreshTokenRepository.save(refreshToken);

        TokenResponse tokenResponse = TokenResponse.builder()
                .accessToken(accessToken)
                .tokenType("Bearer")
                .expiresIn(jwtProvider.getJwtExpiration() / 1000)
                .build();

        return AuthResult.builder()
                .tokenResponse(tokenResponse)
                .rawRefreshToken(rawRefreshToken)
                .refreshExpirationMs(refreshExpirationMs)
                .build();
    }
}
