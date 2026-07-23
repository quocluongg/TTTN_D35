package ptithcm.tttnd35backend.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ptithcm.tttnd35backend.dto.request.LoginRequest;
import ptithcm.tttnd35backend.dto.request.RegisterRequest;
import ptithcm.tttnd35backend.dto.request.ResendOtpRequest;
import ptithcm.tttnd35backend.dto.request.VerifyOtpRequest;
import ptithcm.tttnd35backend.dto.response.ApiResponse;
import ptithcm.tttnd35backend.dto.response.AuthResult;
import ptithcm.tttnd35backend.dto.response.TokenResponse;
import ptithcm.tttnd35backend.service.IAuthService;

import java.time.Duration;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private static final String REFRESH_TOKEN_COOKIE_NAME = "refresh_token";
    // Cookie chỉ được tự động gửi theo API path này path này
    private static final String REFRESH_TOKEN_COOKIE_PATH = "/auth/token";

    private final IAuthService authService;

    @Value("${service.cookie.secure}")
    private boolean cookieSecure;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<?>> register(@RequestBody @Valid RegisterRequest request) {
        authService.register(request);
        return ResponseEntity.ok(ApiResponse.builder()
                .success(true)
                .message("Đăng ký thành công, vui lòng kiểm tra email để lấy mã xác thực")
                .timestamp(LocalDateTime.now())
                .build());
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<ApiResponse<?>> verifyOtp(@RequestBody @Valid VerifyOtpRequest request) {
        authService.verifyOtp(request);
        return ResponseEntity.ok(ApiResponse.builder()
                .success(true)
                .message("Xác thực email thành công")
                .timestamp(LocalDateTime.now())
                .build());
    }

    @PostMapping("/resend-otp")
    public ResponseEntity<ApiResponse<?>> resendOtp(@RequestBody @Valid ResendOtpRequest request) {
        authService.resendRegisterOtp(request.getEmail());
        return ResponseEntity.ok(ApiResponse.builder()
                .success(true)
                .message("Đã gửi lại mã xác thực, vui lòng kiểm tra email")
                .timestamp(LocalDateTime.now())
                .build());
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<TokenResponse>> login(
            @RequestBody @Valid LoginRequest request,
            HttpServletRequest httpRequest) {

        String deviceInfo = httpRequest.getHeader("User-Agent");
        String ipAddress = extractClientIp(httpRequest);

        AuthResult result = authService.login(request, deviceInfo, ipAddress);

        ResponseCookie cookie = buildRefreshTokenCookie(result.getRawRefreshToken(), result.getRefreshExpirationMs());

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(ApiResponse.<TokenResponse>builder()
                        .success(true)
                        .message("Đăng nhập thành công")
                        .data(result.getTokenResponse())
                        .timestamp(LocalDateTime.now())
                        .build());
    }

    private ResponseCookie buildRefreshTokenCookie(String rawRefreshToken, long maxAgeMs) {
        return ResponseCookie.from(REFRESH_TOKEN_COOKIE_NAME, rawRefreshToken)
                .httpOnly(true)
                .secure(cookieSecure) // true ở production (HTTPS), false khi chạy local http
                .sameSite("Strict")
                .path(REFRESH_TOKEN_COOKIE_PATH)
                .maxAge(Duration.ofMillis(maxAgeMs))
                .build();
    }

    // Ưu tiên X-Forwarded-For nếu app chạy sau reverse proxy/load balancer, fallback về remote address
    private String extractClientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
